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
    
    # Get the staff member by the provided ID
    staff_member = get_object_or_404(StaffMember, id=staff_id)

    # Check if the staff member is either a supervisor or an instructor
    if staff_member.role not in [StaffMember.Role.SUPERVISOR, StaffMember.Role.INSTRUCTOR]:
        return Response({"error": "You are not authorized to view this information."}, 
                         status=status.HTTP_403_FORBIDDEN)

    try:
        track_data = None
        course_data = []

        # Handle Supervisor Role: Retrieve tracks they are supervising
        if staff_member.is_supervisor:
            tracks = Track.objects.filter(supervisor=staff_member)
            if tracks.exists():
                track = tracks.first()  # Supervisor can supervise one or more tracks
                track_data = {
                    "id": track.id,
                    "name": track.name,
                    "description": track.description,
                    "track_type": track.track_type,
                    "supervisor": staff_member.get_full_name(),
                    "supervisor_role": staff_member.get_role_display(),
                }
            else:
                track_data = None

        # Handle Instructor Role: Retrieve courses and the related track they are teaching
        if staff_member.is_instructor:
            courses = Course.objects.filter(instructor=staff_member)
            if courses.exists():
                course_data = CourseSerializer(courses, many=True).data  # Serialize courses

                # Retrieve tracks for the courses assigned to the instructor
                track_data = []
                for course in courses:
                    for track in course.tracks.all():  # Access the related tracks
                        track_data.append({
                            "id": track.id,
                            "name": track.name,
                            "description": track.description,
                            "track_type": track.track_type,
                            "instructor": staff_member.get_full_name(),
                            "instructor_role": staff_member.get_role_display(),
                        })

        # If track data exists, include courses with the track details
        if track_data:
            response_data = {
                "staff_member": {
                    "id": staff_member.id,
                    "name": staff_member.get_full_name(),
                    "role": staff_member.get_role_display(),
                    "branch": staff_member.get_branch_location() if staff_member.branch else None
                },
                "tracks": track_data,  # Include track details
                "courses": course_data  # Include course details
            }

            return Response(response_data, status=status.HTTP_200_OK)

        # If no track or course data found, return an error message
        return Response({"error": "No track or courses found for this staff member."}, 
                         status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
