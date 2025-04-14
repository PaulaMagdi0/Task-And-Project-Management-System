from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import StaffMemberSerializer, CreateSupervisorSerializer, ExcelUploadSupervisorSerializer,StaffMemberSerializer
from rest_framework.permissions import IsAuthenticated
from apps.staff_members.models import StaffMember
from apps.staff_members.permissions import IsAdminOrBranchManager
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from apps.tracks.models import Track
from apps.courses.models import Course
from apps.courses.serializers import CourseSerializer
from django.shortcuts import get_object_or_404


class StaffMemberDeleteView(generics.DestroyAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    permission_classes = [IsAdminOrBranchManager] 
class StaffMemberListCreateView(generics.ListCreateAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer  # Change to StaffMemberSerializer for detail view
    permission_classes = []

    def perform_create(self, serializer):
        instance = serializer.save()
        # If creating a branch manager, handle branch assignment
        if instance.role == StaffMember.Role.BRANCH_MANAGER and instance.branch:
            if instance.branch.manager and instance.branch.manager != instance:
                raise ValidationError("This branch already has a manager")
            instance.branch.manager = instance
            instance.branch.save()

class StaffMemberUpdateView(generics.RetrieveUpdateAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer  # Change to StaffMemberSerializer for detail view
    # permission_classes = [IsAuthenticated]
    permission_classes = []

    def perform_update(self, serializer):
        instance = serializer.save()
        # Handle role changes and branch assignments
        if instance.role == StaffMember.Role.BRANCH_MANAGER and instance.branch:
            if instance.branch.manager and instance.branch.manager != instance:
                raise ValidationError("This branch already has a manager")
            instance.branch.manager = instance
            instance.branch.save()
        elif instance.role == StaffMember.Role.SUPERVISOR:
            if not instance.branch:
                raise ValidationError("Supervisors must be assigned to a branch")

class CreateSupervisorView(generics.CreateAPIView):
    queryset = StaffMember.objects.filter(role="supervisor")
    serializer_class = CreateSupervisorSerializer
    # permission_classes = [IsAdminOrBranchManager]
    permission_classes = []

    def perform_create(self, serializer):
        instance = serializer.save(role=StaffMember.Role.SUPERVISOR)
        if not instance.branch:
            raise ValidationError("Supervisors must be assigned to a branch")

class SupervisorBulkUploadView(APIView):
    permission_classes = [IsAdminOrBranchManager]

    def post(self, request, *args, **kwargs):
        serializer = ExcelUploadSupervisorSerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = serializer.create(validated_data=serializer.validated_data)
                # Validate that all created supervisors have branches
                errors = []
                created_supervisors = result.get('created', [])
                for staff in created_supervisors:
                    if not staff.branch:
                        errors.append(f"Supervisor {staff.email} was not assigned to a branch")
                        staff.delete()  # Optionally remove this supervisor from DB
                        created_supervisors.remove(staff)
                
                if errors:
                    result['errors'] = errors
                    result['status'] = 'partial'
                    return Response(result, status=status.HTTP_206_PARTIAL_CONTENT)
                return Response(result, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def supervisor_instructor_by_id_view(request, staff_id):
    """Retrieve the track and courses assigned to a supervisor/instructor by staff member ID."""
    
    staff_member = get_object_or_404(StaffMember, id=staff_id)

    if staff_member.role not in [StaffMember.Role.SUPERVISOR, StaffMember.Role.INSTRUCTOR]:
        return Response({"error": "You are not authorized to view this information."}, 
                         status=status.HTTP_403_FORBIDDEN)

    try:
        track_data = []  # Default to an empty array instead of None
        course_data = []

        # Handle Supervisor Role: Retrieve tracks they are supervising
        if staff_member.is_supervisor:
            tracks = Track.objects.filter(supervisor=staff_member)
            if tracks.exists():
                track = tracks.first()
                track_data = {
                    "id": track.id,
                    "name": track.name,
                    "description": track.description,
                    "track_type": track.track_type,
                    "supervisor": staff_member.get_full_name(),
                    "supervisor_role": staff_member.get_role_display(),
                    "created_at": track.created_at
                }

                # Get courses that belong to the track
                track_courses = Course.objects.filter(tracks=track)
                track_courses_data = []

                for course in track_courses:
                    # Add the track names to the course data
                    course_track_names = [
                        {"id": t.id, "name": t.name} for t in course.tracks.all()  # Include both track ID and name
                    ]
                    
                    # Add instructor details (name and ID)
                    instructor_info = {
                        "id": course.instructor.id if course.instructor else None,
                        "name": course.instructor.get_full_name() if course.instructor else 'No Instructor'
                    }

                    track_courses_data.append({
                        "id": course.id,
                        "name": course.name,
                        "description": course.description,
                        "created_at": course.created_at,
                        "instructor": instructor_info,  # Instructor details
                        "tracks": course_track_names,   # Track details (ID and name)
                    })

                # Get courses directly taught by supervisor (instructor = staff_member)
                taught_courses = Course.objects.filter(instructor=staff_member)
                taught_courses_serialized = CourseSerializer(taught_courses, many=True).data

                return Response({
                    "status": "success",
                    "track": track_data,
                    "track_courses": track_courses_data,
                    "taught_courses": taught_courses_serialized
                })

            else:
                return Response({
                    "status": "success",
                    "message": "Supervisor has no tracks assigned.",
                    "track": track_data,  # Return an empty array for tracks if none exist
                    "track_courses": []
                }, status=status.HTTP_200_OK)

        # Handle Instructor Role: Retrieve courses and the related track they are teaching
        elif staff_member.is_instructor:
            courses = Course.objects.filter(instructor=staff_member)
            if courses.exists():
                course_data = CourseSerializer(courses, many=True).data

                # Retrieve tracks for the courses assigned to the instructor
                track_data = []
                for course in courses:
                    for track in course.tracks.all():
                        track_data.append({
                            "id": track.id,
                            "name": track.name,
                            "description": track.description,
                            "track_type": track.track_type,
                            "instructor": staff_member.get_full_name(),
                            "instructor_role": staff_member.get_role_display(),
                            "created_at": track.created_at
                        })

                return Response({
                    "status": "success",
                    "tracks": track_data,
                    "courses": course_data
                })

            else:
                return Response({
                    "status": "success",
                    "message": "Instructor has no courses assigned.",
                    "tracks": [],  # Return an empty array for tracks if no courses are assigned
                    "courses": []
                }, status=status.HTTP_200_OK)

        return Response({
            "status": "success",
            "track": [],
            "track_courses": [],
            "courses": []
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
