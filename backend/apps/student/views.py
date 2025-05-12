import logging
from rest_framework import status
from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import ExcelUploadSerializer, StudentSerializer, DashboardSerializer, IntakeSerializer
from rest_framework import generics
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from django.db import transaction
from django.core.exceptions import PermissionDenied
from apps.staff_members.permissions import has_student_management_permission
from .models import Student, Intake
from apps.tracks.models import Track
from apps.courses.models import Course
from apps.assignments.models import Assignment
from apps.staff_members.models import StaffMember
from apps.assignments.serializers import AssignmentSerializer
from apps.courses.serializers import CourseSerializer
from rest_framework.views import APIView
from django.contrib.auth.hashers import check_password
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from django.core.validators import validate_email

# Set up logger
logger = logging.getLogger(__name__)

@permission_classes([AllowAny])
@api_view(['POST'])
def upload_excel(request):
    """Handle bulk student creation via Excel upload"""
    print(f"DEBUG: User Authenticated? {request.user.is_authenticated}, User: {request.user}")
    
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication required"}, status=401)

    if not has_student_management_permission(request.user):
        return Response({"detail": "You don't have permission to add students"}, status=403)
    
    # Ensure file, track, and intake are provided
    if 'excel_file' not in request.FILES:
        logger.warning("Excel file missing in upload request")
        return Response(
            {"error": "Excel file is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    if 'track_id' not in request.data:
        logger.warning("Track ID missing in upload request")
        return Response(
            {"error": "Track ID is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    if 'intake_name' not in request.data:
        logger.warning("Intake name missing in upload request")
        return Response(
            {"error": "Intake name is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate the uploaded Excel file
    serializer = ExcelUploadSerializer(
        data=request.data,
        context={'request': request}
    )

    if not serializer.is_valid():
        logger.error(f"Excel validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Process file inside a transaction
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

    except ValidationError as e:
        logger.error(f"Excel processing validation error: {str(e)}")
        error_detail = e.detail if hasattr(e, 'detail') else str(e)
        if isinstance(error_detail, dict) and 'detail' in error_detail and 'errors' in error_detail:
            return Response(
                {
                    "error": "Validation failed",
                    "detail": error_detail['detail'],
                    "errors": error_detail['errors']
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            {"error": "Validation failed", "details": str(error_detail)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.exception(f"Excel processing failed: {str(e)}")
        return Response(
            {"error": "Internal server error during processing"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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
    - intake_id
    """
    logger.debug(f"Incoming FormData: {dict(request.data)}")

    email = request.data.get("email", "").strip().lower()
    intake_id = request.data.get("intake_id", "").strip()
    track_id = request.data.get("track_id", "").strip()
    
    if not email:
        return Response(
            {"error": "Email is required", "field": "email"},
            status=status.HTTP_400_BAD_REQUEST
        )
    if not intake_id:
        return Response(
            {"error": "Intake is required", "field": "intake_id"},
            status=status.HTTP_400_BAD_REQUEST
        )
    if not track_id:
        return Response(
            {"error": "Track is required", "field": "track_id"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate track_id
    try:
        track = Track.objects.get(id=int(track_id))
    except (ValueError, TypeError, Track.DoesNotExist):
        return Response(
            {
                "error": f"Invalid track_id: '{track_id}'",
                "field": "track_id"
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate intake_id
    try:
        intake = Intake.objects.get(id=int(intake_id), track=track)
    except (ValueError, TypeError, Intake.DoesNotExist):
        return Response(
            {
                "error": f"Invalid intake_id: '{intake_id}' or intake does not belong to track",
                "field": "intake_id"
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if student exists
    if Student.objects.filter(email=email, intake=intake).exists():
        return Response(
            {
                "error": f"A student with email '{email}' already exists in intake '{intake.name}'",
                "field": "email",
                "email": email
            },
            status=status.HTTP_409_CONFLICT
        )

    # Collect form data
    data = {
        "first_name": request.data.get("first_name", "").strip(),
        "last_name": request.data.get("last_name", "").strip(),
        "email": email,
        "role": request.data.get("role", "student").strip().lower(),
        "track_id": track_id,
        "intake_id": intake_id,
    }

    # Validate required fields
    required_fields = ['first_name', 'last_name']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return Response(
            {
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "fields": missing_fields
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate with serializer
    serializer = StudentSerializer(data=data)
    
    if serializer.is_valid():
        try:
            student = serializer.save()
            return Response(
                {
                    "message": "Student created successfully",
                    "student": StudentSerializer(student).data
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Error saving student: {str(e)}")
            return Response(
                {"error": f"Failed to create student: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Return detailed validation errors
    errors = serializer.errors
    for field in errors:
        errors[field] = [str(msg) for msg in errors[field]]
    logger.debug(f"Serializer errors: {errors}")
    return Response(
        {
            "error": "Validation failed",
            "details": errors,
            "fields": list(errors.keys())
        },
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def list_students(request):
    """List students with optimized querying and pagination"""
    try:
        # Admins/supervisors see only their track's students
        students = Student.objects.all()
        
        if request.user.groups.filter(name='branchmanager').exists():
            students = students.filter(branch=request.user.branch)
        elif hasattr(request.user, 'staffmember') and request.user.staffmember.role == StaffMember.Role.SUPERVISOR:
            track = request.user.staffmember.track
            students = students.filter(track=track)
        
        # Apply filters
        if track_id := request.query_params.get('track_id'):
            students = students.filter(track_id=track_id)
        
        if intake_id := request.query_params.get('intake_id'):
            students = students.filter(intake_id=intake_id)
        
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_intakes(request):
    """List intakes for the user's track"""
    try:
        if hasattr(request.user, 'staffmember') and request.user.staffmember.role == StaffMember.Role.SUPERVISOR:
            track = request.user.staffmember.track
            intakes = Intake.objects.filter(track=track)
        else:
            intakes = Intake.objects.all()
        if track_id := request.query_params.get('track_id'):
            intakes = intakes.filter(track_id=track_id)
        logger.debug(f"Intakes filtered by track_id={track_id}: {intakes.count()} intakes")
        serializer = IntakeSerializer(intakes, many=True)
        return Response({"intakes": serializer.data}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Intake listing error: {str(e)}")
        return Response(
            {"error": "Failed to retrieve intake list"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_intake(request):
    """Create a new intake for the user's track"""
    try:
        if not has_student_management_permission(request.user):
            return Response(
                {"detail": "You don't have permission to create intakes"},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data.copy()
        # For supervisors, automatically set track from their StaffMember profile
        if hasattr(request.user, 'staffmember') and request.user.staffmember.role == StaffMember.Role.SUPERVISOR:
            if not data.get('track'):
                if not request.user.staffmember.track:
                    return Response(
                        {"detail": "Supervisor is not assigned to a track"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                data['track'] = request.user.staffmember.track.id
            elif str(data['track']) != str(request.user.staffmember.track.id):
                return Response(
                    {"detail": "Supervisors can only create intakes for their assigned track"},
                    status=status.HTTP_403_FORBIDDEN
                )
        # For non-supervisors, ensure track is provided
        elif not data.get('track'):
            return Response(
                {"detail": "Track is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = IntakeSerializer(data=data)
        if serializer.is_valid():
            intake = serializer.save()
            return Response(IntakeSerializer(intake).data, status=status.HTTP_201_CREATED)
        logger.debug(f"Intake creation validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Track.DoesNotExist:
        logger.error("Invalid track ID provided")
        return Response(
            {"detail": "Invalid track ID"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Intake creation error: {str(e)}")
        return Response(
            {"error": f"Failed to create intake: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, verification_code):
    """Email verification endpoint with security checks"""
    try:
        student = get_object_or_404(Student, verification_code=verification_code)

        if student.verified:
            return redirect("http://localhost:5173/verified")

        student.verified = True
        student.verification_code = None
        student.save()

        logger.info(f"Student {student.id} email verified")
        return redirect("http://localhost:5173/verified")

    except Exception as e:
        logger.error(f"Verification failed: {str(e)}")
        return redirect("http://localhost:5173/not-verified")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_courses(request, student_id):
    try:
        # Fetch the student with related track and intake
        student = Student.objects.select_related('track', 'intake').get(id=student_id)

        # Permission check
        if request.user.id != student.id and not isinstance(request.user, StaffMember):
            return Response({"error": "Unauthorized access"}, status=status.HTTP_403_FORBIDDEN)

        # Filter courses by both track and intake
        courses = Course.objects.filter(tracks=student.track, intake=student.intake)

        # Filter assignments by course in the student's track and intake
        assignments = Assignment.objects.filter(
            course__in=courses,
            assignment_students__intake=student.intake
        ).distinct()

        # Serialize data
        course_serializer = CourseSerializer(courses, many=True)
        assignment_serializer = AssignmentSerializer(assignments, many=True)

        return Response({
            'student': {
                'id': student.id,
                'full_name': student.full_name,
                'email': student.email,
                'role': student.role,
                'date_joined': student.date_joined,
                'track_id': student.track.id if student.track else None,
                'intake': student.intake.name if student.intake else None
            },
            'courses': course_serializer.data,
            'assignments': assignment_serializer.data
        }, status=status.HTTP_200_OK)

    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error retrieving courses for student {student_id}: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_student(request, student_id):
    try:
        # Fetch the student object or return a 404 if not found
        student = get_object_or_404(Student, id=student_id)

        # Check permissions: only allow the student to update their own details or a supervisor
        if request.user.id != student.id and request.user.role != 'supervisor':
            return Response({"error": "Permission denied"}, status=403)

        # Get fields from the request
        new_password = request.data.get('newPassword')
        new_email = request.data.get('email')
        first_name = request.data.get('firstName')
        last_name = request.data.get('lastName')
        intake_id = request.data.get('intake_id')

        # Initialize a dictionary to track updates
        updates = {}

        # Password update logic
        if new_password:
            if len(new_password) < 8:
                return Response({"error": "Password too short"}, status=400)
            student.set_password(new_password)
            updates['password'] = '******'

        # Update email if provided
        if new_email:
            try:
                validate_email(new_email)
                if Student.objects.filter(email=new_email, intake=student.intake).exclude(id=student.id).exists():
                    return Response({"error": f"Email '{new_email}' already exists in intake '{student.intake.name}'"}, status=400)
                student.email = new_email
                updates['email'] = new_email
            except ValidationError:
                return Response({"error": "Invalid email format"}, status=400)

        # Update first and last names if provided
        if first_name:
            student.first_name = first_name
            updates['firstName'] = first_name

        if last_name:
            student.last_name = last_name
            updates['lastName'] = last_name

        # Update intake if provided
        if intake_id:
            try:
                intake = Intake.objects.get(id=intake_id, track=student.track)
                if Student.objects.filter(email=student.email, intake=intake).exclude(id=student.id).exists():
                    return Response({"error": f"Email '{student.email}' already exists in intake '{intake.name}'"}, status=400)
                student.intake = intake
                updates['intake'] = intake.name
            except Intake.DoesNotExist:
                return Response({"error": f"Intake with ID '{intake_id}' does not exist or does not belong to student's track"}, status=400)

        # Save the student object and commit changes to the database
        student.save()

        # Log the updates and return success response
        logger.info(f"Student with ID {student_id} updated: {updates}")
        return Response({"message": "Student updated successfully", "updates": updates})

    except Exception as e:
        # Log and handle unexpected errors
        logger.error(f"Error updating student with ID {student_id}: {str(e)}")
        return Response({"error": str(e)}, status=500)

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

class IntakeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        """Delete an intake and its associated students"""
        if not has_student_management_permission(request.user):
            raise PermissionDenied("You don't have permission to delete intakes")

        try:
            intake = Intake.objects.get(pk=pk)
            # Supervisors can only delete intakes for their track
            if (
                hasattr(request.user, 'staffmember') 
                and request.user.staffmember.role == StaffMember.Role.SUPERVISOR
                and request.user.staffmember.track != intake.track
            ):
                return Response(
                    {"error": "Supervisors can only delete intakes for their assigned track"},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Explicitly delete associated students
            Student.objects.filter(intake=intake).delete()
            intake.delete()  # Delete the intake
            logger.warning(f"Intake {pk} and associated students deleted by user {request.user.id}")
            return Response({"detail": "Intake and associated students deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Intake.DoesNotExist:
            logger.error(f"Intake {pk} not found")
            return Response({"error": "Intake not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Deletion failed for intake {pk}: {str(e)}")
            return Response({"error": f"Deletion failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            'create': {
                'method': 'POST',
                'url': '/api/student/create/',
                'description': 'Create a single student via form'
            },
            'list': {
                'method': 'GET',
                'url': '/api/student/list/',
                'description': 'List students with pagination and filtering'
            },
            'intakes': {
                'method': 'GET',
                'url': '/api/student/intakes/',
                'description': 'List intakes for the user\'s track'
            },
            'create_intake': {
                'method': 'POST',
                'url': '/api/student/intakes/create/',
                'description': 'Create a new intake for the user\'s track'
            },
            'delete_intake': {
                'method': 'DELETE',
                'url': '/api/student/intakes/<int:pk>/',
                'description': 'Delete an intake and its associated students'
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
            },
            'update_student': {
                'method': 'PATCH',
                'url': '/api/student/<int:student_id>/update/',
                'description': 'Update student details'
            },
            'delete_student': {
                'method': 'DELETE',
                'url': '/api/student/<int:student_id>/delete/',
                'description': 'Delete a student'
            },
            'student_courses': {
                'method': 'GET',
                'url': '/api/student/<int:student_id>/courses/',
                'description': 'Get courses for a student'
            },
            'students_by_track_and_course': {
                'method': 'GET',
                'url': '/api/student/tracks/<int:track_id>/courses/<int:course_id>/students/',
                'description': 'Get students by track and course'
            },
            'students_by_staff': {
                'method': 'GET',
                'url': '/api/student/by-staff/<int:staff_id>/',
                'description': 'Get students by staff member'
            }
        }
    }
    return Response(options)

class StudentsByTrackAndCourseView(APIView):
    def get(self, request, track_id, course_id, intake_id):
        # Get the track, course, and intake based on the provided IDs
        track = get_object_or_404(Track, id=track_id)
        course = get_object_or_404(Course, id=course_id)
        intake = get_object_or_404(Intake, id=intake_id, track=track)

        # Check if the course is part of the track
        if course not in track.courses.all():
            return Response(
                {"detail": "Course is not associated with the track."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Filter students based on track, course, and intake
        students_in_track_course_intake = Student.objects.filter(
            track=track,
            intake=intake,
            track__courses=course
        )

        # Prepare the data for response
        student_data = []
        for student in students_in_track_course_intake:
            student_data.append({
                "id": student.id,
                "name": student.full_name,
                "email": student.email,
                "intake": student.intake.name if student.intake else None,
                "track": student.track.name,
                "course": course.name,
            })

        return Response(student_data, status=status.HTTP_200_OK)
class StudentsByStaffView(APIView):
    def get(self, request, staff_id):
        try:
            staff = StaffMember.objects.get(id=staff_id)
        except StaffMember.DoesNotExist:
            return Response({'error': 'Staff member not found.'}, status=status.HTTP_404_NOT_FOUND)

        if staff.role == StaffMember.Role.SUPERVISOR:
            # Get tracks supervised by the staff
            tracks = Track.objects.filter(supervisor=staff)
            students = Student.objects.filter(track__in=tracks)

        elif staff.role == StaffMember.Role.INSTRUCTOR:
            # Get courses taught by this instructor
            courses = Course.objects.filter(instructor=staff)

            # Get track IDs linked to these courses through CourseTrack
            track_ids = CourseTrack.objects.filter(course__in=courses).values_list('track_id', flat=True)

            # Get students in those tracks
            students = Student.objects.filter(track_id__in=track_ids).distinct()

        else:
            return Response({'error': 'Staff member must be a supervisor or instructor.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    
@permission_classes([IsAuthenticated])
class IntakeStudentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, intake_id):
        try:
            intake = Intake.objects.get(id=intake_id)
            students = Student.objects.filter(intake=intake)
            serializer = StudentSerializer(students, many=True)
            return Response(serializer.data)
        except Intake.DoesNotExist:
            return Response({"error": "Intake not found"}, status=status.HTTP_404_NOT_FOUND)