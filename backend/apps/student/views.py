import logging
from rest_framework import status
from rest_framework.response import Response
from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes,parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import ExcelUploadSerializer, StudentSerializer, DashboardSerializer
from rest_framework import generics
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from django.db import transaction
from django.core.exceptions import PermissionDenied
from apps.staff_members.permissions import has_student_management_permission
from .models import Student
from apps.tracks.models import Track  # Adjust based on your app structure
from apps.courses.models import Course
from apps.staff_members.models import StaffMember
from apps.courses.serializers import CourseSerializer  # Ensure you have this serializer
from rest_framework.views import APIView

logger = logging.getLogger(__name__)
#UPload Excel File View

@permission_classes([AllowAny])
@api_view(['POST'])
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
@parser_classes([MultiPartParser, FormParser])
def create_student_from_form(request):
    """
    Accepts FormData input and creates a new student.
    Expected FormData fields:
    - first_name
    - last_name
    - email
    - role
    - track_id
    """
    email = request.data.get("email", "").strip().lower()
    
    if not email:
        return Response(
            {"error": "Email is required.", "field": "email"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if student exists first to provide immediate feedback
    if Student.objects.filter(email=email).exists():
        return Response(
            {
                "error": f"A student with email '{email}' already exists",
                "field": "email",
                "email": email
            },
            status=status.HTTP_409_CONFLICT
        )

    # Extract username from email
    username = email.split("@")[0]

    # Collecting form data
    data = {
        "first_name": request.data.get("first_name", "").strip(),
        "last_name": request.data.get("last_name", "").strip(),
        "email": email,
        "role": request.data.get("role", "student"),
        "track_id": request.data.get("track_id"),
        "username": username,
    }

    # Validate required fields
    required_fields = ['first_name', 'last_name', 'track_id']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return Response(
            {
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "fields": missing_fields
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if the track_id is valid
    try:
        track = Track.objects.get(id=data['track_id'])
        data["track"] = track
    except Track.DoesNotExist:
        return Response(
            {
                "error": f"Invalid track_id provided: {data['track_id']}",
                "field": "track_id"
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate the serializer with the data
    serializer = StudentSerializer(data=data)
    
    if serializer.is_valid():
        try:
            serializer.save()
            return Response(
                {
                    "message": "Student created successfully",
                    "student": serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Error saving student: {str(e)}")
            return Response(
                {"error": "Failed to create student due to server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Return serializer errors with field-specific information
    errors = serializer.errors
    for field in errors:
        errors[field] = [str(msg) for msg in errors[field]]
    return Response(
        {
            "error": "Validation failed",
            "details": errors,
            "fields": list(errors.keys())
        },
        status=status.HTTP_400_BAD_REQUEST
    )

# List All Student View 
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
            return redirect("http://localhost:5174/verified")

        student.verified = True
        student.verification_code = None
        student.save()

        logger.info(f"Student {student.id} email verified")
        return redirect("http://localhost:5174/verified")

    except Exception as e:
        logger.error(f"Verification failed: {str(e)}")
        return redirect("http://localhost:5174/not-verified")

            
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_courses(request, student_id):
    try:
        # Get requested student
        student = Student.objects.select_related('user').get(id=student_id)
        # logger.info(f"User ID from token: {request.user.id}")

        # Verify permission
        if request.user != student.user and not request.user.is_staff:
            return Response(
                {"error": "Unauthorized access"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Rest of your existing view logic...
        courses = Course.objects.filter(tracks=student.track)
        serializer = CourseSerializer(courses, many=True)
        
        return Response({
            'student': {
                'id': student.id,
                'name': student.full_name
            },
            'courses': serializer.data
        })
        
    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=404)
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return Response({"error": "Server error"}, status=500)
    
#UPdate student Info View

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_student(request, student_id):
    """Change the student's password only"""
    student = get_object_or_404(Student, id=student_id)
    
    # Permission check: Ensure the user has permission to change the password
    if request.user.id != student_id:
        return Response(
            {"error": "You do not have permission to change this password"},
            status=status.HTTP_403_FORBIDDEN
        )

    current_password = request.data.get('currentPassword')
    new_password = request.data.get('newPassword')

    if not current_password or not new_password:
        return Response(
            {"error": "Both current password and new password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Authenticate the user to verify the current password
    user = student.user
    if not authenticate(username=user.username, password=current_password):
        return Response(
            {"error": "Current password is incorrect"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Update the password and save it
    user.password = make_password(new_password)
    user.save()

    return Response({"message": "Password updated successfully"})



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
#Return The students For Track And Course
# http://127.0.0.1:8000/api/student/tracks/track_id/courses/course_id/students/
class StudentsByTrackAndCourseView(APIView):
    def get(self, request, track_id, course_id):
        # Get the track and course based on the provided IDs
        track = get_object_or_404(Track, id=track_id)
        course = get_object_or_404(Course, id=course_id)

        # Check if the course is part of the track
        if course not in track.courses.all():
            return Response(
                {"detail": "Course is not associated with the track."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Filter students based on the track and course using the many-to-many relationship through CourseTrack
        students_in_track_and_course = Student.objects.filter(
            track=track,  # Students must be assigned to the track
            track__courses=course  # Students must be linked to the course via the track
        )

        # Prepare the data for response
        student_data = []
        for student in students_in_track_and_course:
            student_data.append({
                "id": student.id,
                "name": student.full_name,
                "email": student.email,
                "track": student.track.name,
                "course": course.name,
            })

        return Response(student_data, status=status.HTTP_200_OK)