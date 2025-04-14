import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes,parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import ExcelUploadSerializer, StudentSerializer, DashboardSerializer
from rest_framework import generics
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.core.exceptions import PermissionDenied
from apps.staff_members.permissions import has_student_management_permission
from .models import Student
from apps.tracks.models import Track  # Adjust based on your app structure
from apps.courses.models import Course
from apps.staff_members.models import StaffMember
from apps.courses.serializers import CourseSerializer  # Ensure you have this serializer

logger = logging.getLogger(__name__)
#UPload Excel File View
@api_view(['POST'])
# @permission_classes([IsAuthenticated])  # ✅ Enforce authentication
@permission_classes([AllowAny])
def upload_excel(request):
    """Handle bulk student creation via Excel upload"""
    print(f"DEBUG: User Authenticated? {request.user.is_authenticated}, User: {request.user}")
    
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication required"}, status=401)

    if not has_student_management_permission(request.user):
        return Response({"detail": "You don't have permission to add students"}, status=403)
    
    # ✅ Prevent AttributeError for Anonymous Users
    user_role = getattr(request.user, 'role', 'Unknown')
    is_superuser = getattr(request.user, 'is_superuser', False)
    print(f"User Role: {user_role}, Superuser: {is_superuser}")

    # ✅ Permission Check
    if not has_student_management_permission(request.user):
        raise PermissionDenied("You don't have permission to add students")

    # ✅ Ensure file is provided
    if 'excel_file' not in request.FILES:
        logger.warning("Excel file missing in upload request")
        return Response(
            {"error": "Excel file is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # ✅ Validate the uploaded Excel file
    serializer = ExcelUploadSerializer(
        data=request.data,
        context={'request': request}
    )

    if not serializer.is_valid():
        logger.error(f"Excel validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ✅ Process file inside a transaction
    try:
        with transaction.atomic():
            result = serializer.save()
            
            if result.get('error_count', 0) > 0:
                return Response({
                    "status": "partial_success",
                    "created_count": result.get('created_count', 0),
                    "error_count": result.get('error_count', 0),
                    "errors": result.get('errors', []),
                    "students": result.get('students', [])
                }, status=status.HTTP_207_MULTI_STATUS)
            
            return Response({
                "status": "success",
                "created_count": result.get('created_count', 0),
                "students": result.get('students', [])
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception(f"Excel processing failed: {str(e)}")
        return Response(
            {"error": "Internal server error during processing"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

#Create Single Student View
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])  # Supports FormData
def create_student_from_form(request):
    """
    Accepts FormData input and creates a new student.
    Expected FormData fields:
    - first_name
    - last_name
    - email
    - role
    - track_id
    - password (optional)
    """
    email = request.data.get("email")
    
    if not email:
        return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

    # Extract username from email
    username = email.split("@")[0]

    # Collecting form data
    data = {
        "first_name": request.data.get("first_name"),
        "last_name": request.data.get("last_name"),
        "email": email,
        "role": request.data.get("role"),
        "track_id": request.data.get("track_id"),
        "username": username,  # Add extracted username
        # "password": request.data.get("password", None),  # Optional
    }

    # Check if the track_id is valid
    try:
        track = Track.objects.get(id=data.get('track_id'))
    except Track.DoesNotExist:
        return Response({"error": "Invalid track_id provided."}, status=status.HTTP_400_BAD_REQUEST)

    # Add the track object to the data instead of just the track_id
    data["track"] = track

    # Validate the serializer with the data
    serializer = StudentSerializer(data=data)
    
    if serializer.is_valid():
        serializer.save()  # Save the student object
        return Response({"message": "Student created successfully"}, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# List All Student View 
@api_view(['GET'])
# @permission_classes([IsAuthenticated])
@permission_classes([AllowAny])
def list_students(request):
    """List students with optimized querying and pagination"""
    try:
        # Admins/supervisors see all, branch managers see their branch only
        students = Student.objects.all()
        
        if request.user.groups.filter(name='branchmanager').exists():
            students = students.filter(branch=request.user.branch)
        
        # Apply filters
        if track_id := request.query_params.get('track_id'):
            students = students.filter(track_id=track_id)
        
        if is_active := request.query_params.get('is_active'):
            students = students.filter(is_active=is_active.lower() == 'true')

        # Pagination
        page = request.query_params.get('page', 1)
        page_size = min(int(request.query_params.get('page_size', 20)), 100)
        paginated_students = students[(page-1)*page_size : page*page_size]

        serializer = StudentSerializer(paginated_students, many=True)
        return Response({
            "count": students.count(),
            "page": page,
            "page_size": page_size,
            "students": serializer.data
        })

    except Exception as e:
        logger.error(f"Student listing error: {str(e)}")
        return Response(
            {"error": "Failed to retrieve student list"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Verfiy View 
@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, verification_code):
    """Email verification endpoint with security checks"""
    try:
        student = get_object_or_404(Student, verification_code=verification_code)
        
        if student.verified:
            return Response(
                {'status': 'already_verified'}, 
                status=status.HTTP_200_OK
            )

        student.verified = True
        student.verification_code = None
        student.save()
        
        logger.info(f"Student {student.id} email verified")
        return Response(
            {'status': 'success'},
            status=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(f"Verification failed: {str(e)}")
        return Response(
            {'status': 'invalid_code'},
            status=status.HTTP_400_BAD_REQUEST
        )
@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Ensure only authenticated users can access
def student_courses(request, student_id):
    """Retrieve courses and track information for a specific student by their ID."""
    try:
        # Fetch student with related track info
        student = Student.objects.filter(id=student_id).select_related('track').first()

        if not student:
            logger.error(f"Student with ID {student_id} not found.")
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

        if not student.track:
            logger.error(f"Student with ID {student_id} has no track assigned.")
            return Response({"error": "Student is not assigned to any track"}, status=status.HTTP_400_BAD_REQUEST)

        # Assuming 'tracks' is a ManyToManyField in the Course model
        courses = Course.objects.filter(tracks=student.track).select_related('instructor')

        # Get the supervisor of the student's track
        supervisor = student.track.supervisor

        # Serialize course data, including instructor info
        course_data = CourseSerializer(courses, many=True).data
        
        # Prepare track information
        track_data = {
            "id": student.track.id,
            "name": student.track.name,
            "description": student.track.description,
            "track_type": student.track.track_type,
            "supervisor": {
                "id": supervisor.id if supervisor else None,
                "name": supervisor.get_full_name() if supervisor else "No Supervisor",
                "email": supervisor.email if supervisor else None,
            } if supervisor else None,
            "branch": {
                "id": student.track.branch.id if student.track.branch else None,
                "name": student.track.branch.name if student.track.branch else "No Branch",
            }
        }

        # Prepare student data
        student_data = {
            "id": student.id,
            "name": student.full_name,
            "email": student.email,
            "track": track_data
        }

        return Response({
            "student": student_data,
            "courses": course_data  # Courses with instructor info included
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error retrieving student courses: {str(e)}")
        return Response(
            {"error": "Failed to retrieve student courses"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

#UPdate student Info View

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_student(request, student_id):
    """Secure student update with permission checks"""
    student = get_object_or_404(Student, id=student_id)
    
    # Permission check
    if not (has_student_management_permission(request.user) or request.user.id == student_id):
        raise PermissionDenied("You don't have permission to update this student")

    serializer = StudentSerializer(
        student, 
        data=request.data, 
        partial=True,
        context={'request': request}
    )

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        serializer.save()
        logger.info(f"Student {student_id} updated by user {request.user.id}")
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Update failed for student {student_id}: {str(e)}")
        return Response(
            {"error": "Update failed"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_student(request, student_id):
    """Student deletion with confirmation checks"""
    if not has_student_management_permission(request.user):
        raise PermissionDenied("You don't have permission to delete students")

    student = get_object_or_404(Student, id=student_id)
    
    try:
        student.delete()
        logger.warning(f"Student {student_id} deleted by user {request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    except Exception as e:
        logger.error(f"Deletion failed for student {student_id}: {str(e)}")
        return Response(
            {"error": "Deletion failed"}, 
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
