from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics
from .serializers import ExcelUploadSerializer, StudentSerializer, DashboardSerializer
from apps.student.models import Student
from apps.tracks.models import Track
import logging
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.core.exceptions import PermissionDenied
from django.conf import settings
from django.core.mail import send_mail
from apps.staff_members.permissions import has_student_management_permission

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_students(request):
    """
    Handle both bulk Excel upload and single student creation
    with proper authentication and permission checks
    """
    # Permission check
    if not has_student_management_permission(request.user):
        return Response(
            {"detail": "You don't have permission to manage students"},
            status=status.HTTP_403_FORBIDDEN
        )

    # Excel file upload handling
    if 'excel_file' in request.FILES:
        serializer = ExcelUploadSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            logger.error(f"Excel validation failed: {serializer.errors}")
            return Response(
                {
                    'success': False,
                    'message': 'Invalid file upload',
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            with transaction.atomic():
                result = serializer.save()
                
                response_data = {
                    'success': True,
                    'status': 'partial_success' if result.get('error_count', 0) > 0 else 'success',
                    'message': f"Successfully created {result.get('created_count', 0)} students",
                    'created_count': result.get('created_count', 0),
                    'students': result.get('students', [])
                }
                
                if result.get('error_count', 0) > 0:
                    response_data['error_count'] = result.get('error_count')
                    response_data['errors'] = result.get('errors')
                    if len(result.get('errors', [])) <= 10:
                        response_data['sample_errors'] = result.get('errors')[:5]
                
                status_code = status.HTTP_207_MULTI_STATUS if result.get('error_count', 0) > 0 else status.HTTP_201_CREATED
                return Response(response_data, status=status_code)
                
        except Exception as e:
            logger.error(f"Excel processing failed: {str(e)}")
            return Response(
                {
                    'success': False,
                    'message': 'Failed to process Excel file',
                    'error': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    # Single student creation
    data = request.data.copy()
    data['role'] = data.get('role', 'student')  # Default role
    
    serializer = StudentSerializer(
        data=data,
        context={'request': request}
    )
    
    if not serializer.is_valid():
        return Response(
            {
                'success': False,
                'message': 'Validation failed',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        with transaction.atomic():
            student = serializer.save()
            return Response(
                {
                    'success': True,
                    'message': 'Student created successfully. Verification email sent.',
                    'student': StudentSerializer(student).data
                },
                status=status.HTTP_201_CREATED
            )
    except Exception as e:
        logger.error(f"Student creation failed: {str(e)}")
        return Response(
            {
                'success': False,
                'message': 'Failed to create student',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_students(request):
    """
    List students with optimized querying, filtering and pagination
    """
    try:
        students = Student.objects.all()
        
        # Apply permission-based filtering
        if request.user.groups.filter(name='branchmanager').exists():
            students = students.filter(branch=request.user.branch)
        
        # Apply filters from query params
        if track_id := request.query_params.get('track_id'):
            students = students.filter(track_id=track_id)
        
        if is_active := request.query_params.get('is_active'):
            students = students.filter(is_active=is_active.lower() == 'true')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 20)), 100)
        paginated_students = students[(page-1)*page_size : page*page_size]

        serializer = StudentSerializer(paginated_students, many=True)
        return Response({
            "success": True,
            "count": students.count(),
            "page": page,
            "page_size": page_size,
            "students": serializer.data
        })

    except Exception as e:
        logger.error(f"Student listing error: {str(e)}")
        return Response(
            {
                "success": False,
                "error": "Failed to retrieve student list",
                "message": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, verification_code):
    """
    Email verification endpoint with security checks
    """
    try:
        student = get_object_or_404(Student, verification_code=verification_code)
        
        if student.verified:
            return Response(
                {
                    'success': True,
                    'status': 'already_verified',
                    'message': 'Email already verified'
                },
                status=status.HTTP_200_OK
            )

        student.verified = True
        student.verification_code = None
        student.save()
        
        logger.info(f"Student {student.id} email verified")
        return Response(
            {
                'success': True,
                'status': 'success',
                'message': 'Email verified successfully'
            },
            status=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(f"Verification failed: {str(e)}")
        return Response(
            {
                'success': False,
                'status': 'invalid_code',
                'message': 'Invalid verification code or link has expired'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_student(request, student_id):
    """
    Secure student update with permission checks
    """
    student = get_object_or_404(Student, id=student_id)
    
    # Permission check - either has management permission or is updating own profile
    if not (has_student_management_permission(request.user) or request.user.id == student_id):
        return Response(
            {
                'success': False,
                'message': "You don't have permission to update this student"
            },
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = StudentSerializer(
        student, 
        data=request.data, 
        partial=True,
        context={'request': request}
    )

    if not serializer.is_valid():
        return Response(
            {
                'success': False,
                'message': 'Validation failed',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():
            serializer.save()
            logger.info(f"Student {student_id} updated by user {request.user.id}")
            return Response(
                {
                    'success': True,
                    'message': 'Student updated successfully',
                    'student': serializer.data
                }
            )
    
    except Exception as e:
        logger.error(f"Update failed for student {student_id}: {str(e)}")
        return Response(
            {
                'success': False,
                'message': 'Update failed',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_student(request, student_id):
    """
    Student deletion with confirmation checks
    """
    if not has_student_management_permission(request.user):
        return Response(
            {
                'success': False,
                'message': "You don't have permission to delete students"
            },
            status=status.HTTP_403_FORBIDDEN
        )

    student = get_object_or_404(Student, id=student_id)
    
    try:
        with transaction.atomic():
            student.delete()
            logger.warning(f"Student {student_id} deleted by user {request.user.id}")
            return Response(
                {
                    'success': True,
                    'message': 'Student deleted successfully'
                },
                status=status.HTTP_204_NO_CONTENT
            )
    
    except Exception as e:
        logger.error(f"Deletion failed for student {student_id}: {str(e)}")
        return Response(
            {
                'success': False,
                'message': 'Deletion failed',
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class StudentDashboardAPI(generics.RetrieveAPIView):
    """
    Student dashboard with personalized data
    """
    serializer_class = DashboardSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        # Returns the logged-in student's profile
        return self.request.user.student_profile

@api_view(['GET'])
@permission_classes([AllowAny])
def show_options(request):
    """
    API endpoint options documentation
    """
    options = {
        'endpoints': {
            'upload': {
                'method': 'POST',
                'url': '/api/student/upload/',
                'description': 'Upload students via Excel or create single student'
            },
            'list': {
                'method': 'GET',
                'url': '/api/student/list/',
                'description': 'List students with pagination and filtering'
            },
            'verify': {
                'method': 'GET',
                'url': '/api/student/verify/<str:verification_code>/',
                'description': 'Verify student email'
            },
            'dashboard': {
                'method': 'GET',
                'url': '/api/student/dashboard/',
                'description': 'Get student dashboard data (authenticated only)'
            }
        }
    }
    return Response(options)