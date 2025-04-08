# from rest_framework import status
# from rest_framework.response import Response
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated, AllowAny
# from .serializers import ExcelUploadSerializer, StudentSerializer, DashboardSerializer
# from rest_framework import generics
# from apps.student.models import Student
# import logging
# from django.shortcuts import get_object_or_404
# from django.db import transaction
# from django.core.exceptions import PermissionDenied
# from apps.staff_members.permissions import has_student_management_permission

# logger = logging.getLogger(__name__)


# @api_view(['POST'])
# # @permission_classes([IsAuthenticated])  # ✅ Enforce authentication
# @permission_classes([AllowAny])
# def upload_excel(request):
#     """Handle bulk student creation via Excel upload"""
#     print(f"DEBUG: User Authenticated? {request.user.is_authenticated}, User: {request.user}")
    
#     if not request.user.is_authenticated:
#         return Response({"detail": "Authentication required"}, status=401)

#     if not has_student_management_permission(request.user):
#         return Response({"detail": "You don't have permission to add students"}, status=403)
    
#     # ✅ Prevent AttributeError for Anonymous Users
#     user_role = getattr(request.user, 'role', 'Unknown')
#     is_superuser = getattr(request.user, 'is_superuser', False)
#     print(f"User Role: {user_role}, Superuser: {is_superuser}")

#     # ✅ Permission Check
#     if not has_student_management_permission(request.user):
#         raise PermissionDenied("You don't have permission to add students")

#     # ✅ Ensure file is provided
#     if 'excel_file' not in request.FILES:
#         logger.warning("Excel file missing in upload request")
#         return Response(
#             {"error": "Excel file is required"}, 
#             status=status.HTTP_400_BAD_REQUEST
#         )

#     # ✅ Validate the uploaded Excel file
#     serializer = ExcelUploadSerializer(
#         data=request.data,
#         context={'request': request}
#     )

#     if not serializer.is_valid():
#         logger.error(f"Excel validation failed: {serializer.errors}")
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     # ✅ Process file inside a transaction
#     try:
#         with transaction.atomic():
#             result = serializer.save()
            
#             if result.get('error_count', 0) > 0:
#                 return Response({
#                     "status": "partial_success",
#                     "created_count": result.get('created_count', 0),
#                     "error_count": result.get('error_count', 0),
#                     "errors": result.get('errors', []),
#                     "students": result.get('students', [])
#                 }, status=status.HTTP_207_MULTI_STATUS)
            
#             return Response({
#                 "status": "success",
#                 "created_count": result.get('created_count', 0),
#                 "students": result.get('students', [])
#             }, status=status.HTTP_201_CREATED)

#     except Exception as e:
#         logger.exception(f"Excel processing failed: {str(e)}")
#         return Response(
#             {"error": "Internal server error during processing"},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )


# @api_view(['GET'])
# # @permission_classes([IsAuthenticated])
# @permission_classes([AllowAny])

# def list_students(request):
#     """List students with optimized querying and pagination"""
#     try:
#         # Admins/supervisors see all, branch managers see their branch only
#         students = Student.objects.all()
        
#         if request.user.groups.filter(name='branchmanager').exists():
#             students = students.filter(branch=request.user.branch)
        
#         # Apply filters
#         if track_id := request.query_params.get('track_id'):
#             students = students.filter(track_id=track_id)
        
#         if is_active := request.query_params.get('is_active'):
#             students = students.filter(is_active=is_active.lower() == 'true')

#         # Pagination
#         page = request.query_params.get('page', 1)
#         page_size = min(int(request.query_params.get('page_size', 20)), 100)
#         paginated_students = students[(page-1)*page_size : page*page_size]

#         serializer = StudentSerializer(paginated_students, many=True)
#         return Response({
#             "count": students.count(),
#             "page": page,
#             "page_size": page_size,
#             "students": serializer.data
#         })

#     except Exception as e:
#         logger.error(f"Student listing error: {str(e)}")
#         return Response(
#             {"error": "Failed to retrieve student list"},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )


# @api_view(['GET'])
# @permission_classes([AllowAny])
# def verify_email(request, verification_code):
#     """Email verification endpoint with security checks"""
#     try:
#         student = get_object_or_404(Student, verification_code=verification_code)
        
#         if student.verified:
#             return Response(
#                 {'status': 'already_verified'}, 
#                 status=status.HTTP_200_OK
#             )

#         student.verified = True
#         student.verification_code = None
#         student.save()
        
#         logger.info(f"Student {student.id} email verified")
#         return Response(
#             {'status': 'success'},
#             status=status.HTTP_200_OK
#         )

#     except Exception as e:
#         logger.error(f"Verification failed: {str(e)}")
#         return Response(
#             {'status': 'invalid_code'},
#             status=status.HTTP_400_BAD_REQUEST
#         )


# @api_view(['PATCH'])
# @permission_classes([IsAuthenticated])
# def update_student(request, student_id):
#     """Secure student update with permission checks"""
#     student = get_object_or_404(Student, id=student_id)
    
#     # Permission check
#     if not (has_student_management_permission(request.user) or request.user.id == student_id):
#         raise PermissionDenied("You don't have permission to update this student")

#     serializer = StudentSerializer(
#         student, 
#         data=request.data, 
#         partial=True,
#         context={'request': request}
#     )

#     if not serializer.is_valid():
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     try:
#         serializer.save()
#         logger.info(f"Student {student_id} updated by user {request.user.id}")
#         return Response(serializer.data)
    
#     except Exception as e:
#         logger.error(f"Update failed for student {student_id}: {str(e)}")
#         return Response(
#             {"error": "Update failed"}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )


# @api_view(['DELETE'])
# @permission_classes([IsAuthenticated])
# def delete_student(request, student_id):
#     """Student deletion with confirmation checks"""
#     if not has_student_management_permission(request.user):
#         raise PermissionDenied("You don't have permission to delete students")

#     student = get_object_or_404(Student, id=student_id)
    
#     try:
#         student.delete()
#         logger.warning(f"Student {student_id} deleted by user {request.user.id}")
#         return Response(status=status.HTTP_204_NO_CONTENT)
    
#     except Exception as e:
#         logger.error(f"Deletion failed for student {student_id}: {str(e)}")
#         return Response(
#             {"error": "Deletion failed"}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
        
# class StudentDashboardAPI(generics.RetrieveAPIView):
#     """
#     Student dashboard with personalized data
#     """
#     serializer_class = DashboardSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_object(self):
#         # Returns the logged-in student's profile
#         return self.request.user.student_profile


# @api_view(['GET'])
# @permission_classes([AllowAny])
# def show_options(request):
#     """
#     API endpoint options documentation
#     """
#     options = {
#         'endpoints': {
#             'upload': {
#                 'method': 'POST',
#                 'url': '/api/student/upload/',
#                 'description': 'Upload students via Excel or create single student'
#             },
#             'list': {
#                 'method': 'GET',
#                 'url': '/api/student/list/',
#                 'description': 'List students with pagination and filtering'
#             },
#             'verify': {
#                 'method': 'GET',
#                 'url': '/api/student/verify/<str:verification_code>/',
#                 'description': 'Verify student email'
#             },
#             'dashboard': {
#                 'method': 'GET',
#                 'url': '/api/student/dashboard/',
#                 'description': 'Get student dashboard data (authenticated only)'
#             }
#         }
#     }
#     return Response(options)        

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .serializers import ExcelUploadSerializer, StudentSerializer, DashboardSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from .models import Student
from django.conf import settings
from django.core.mail import send_mail
import secrets
import string
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def upload_student(request):
    # Excel file upload handling
    if 'excel_file' in request.FILES:
        serializer = ExcelUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid file upload',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            result = serializer.process_excel()
            response_data = {
                'success': True,
                'message': f"Successfully created {result['created']} students",
                'created': result['created']
            }
            if result.get('errors'):
                response_data['warning'] = f"{len(result['errors'])} rows had errors"
                response_data['error_count'] = len(result['errors'])
                if len(result['errors']) <= 10:
                    response_data['sample_errors'] = result['errors'][:5]
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Excel processing failed: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to process Excel file',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # Single student creation
    data = request.data.copy()
    data['role'] = data.get('role', 'student')  # Default role
    
    serializer = StudentSerializer(data=data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        student = serializer.save()
        return Response({
            'success': True,
            'message': 'Student created successfully. Verification email sent.',
            'student': StudentSerializer(student).data
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Student creation failed: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to create student',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def list_students(request):
    students = Student.objects.all()
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def show_options(request):
    options = {
        'upload_endpoint': '/api/student/upload/',
        'list_endpoint': '/api/student/list/',
        'verify_endpoint': '/api/student/verify/<str:verification_code>/'
    }
    return Response(options)

@api_view(['GET'])
def verify_email(request, verification_code):
    try:
        student = Student.objects.get(verification_code=verification_code)
        if student.verified:
            return Response({'status': 'Email already verified'}, status=status.HTTP_200_OK)
            
        student.verified = True
        student.verification_code = None
        student.save()
        
        return Response({'status': 'Email verified successfully'})
    except Student.DoesNotExist:
        return Response(
            {'error': 'Invalid verification code or link has expired'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
class StudentDashboardAPI(generics.RetrieveAPIView):
    serializer_class = DashboardSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        # Returns the logged-in student's profile
        return self.request.user.student_profile