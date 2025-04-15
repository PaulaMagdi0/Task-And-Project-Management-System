from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import StaffMemberSerializer, CreateSupervisorSerializer, ExcelUploadSupervisorSerializer,StaffMemberSerializer
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminOrBranchManager
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from apps.tracks.models import Track
from apps.courses.serializers import CourseSerializer
from django.shortcuts import get_object_or_404
from django.views import View
from django.http import JsonResponse
from rest_framework import generics
from rest_framework.response import Response
from .serializers import CreateInstructorSerializer
from django.db import transaction
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from .models import StaffMember
from apps.courses.models import Course  # Import Course model
import logging
logger = logging.getLogger(__name__)


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



class CreateInstructorView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = CreateInstructorSerializer(data=request.data)
        if serializer.is_valid():
            # Log the incoming request data for debugging
            logger.debug(f"Received data: {request.data}")
            # Save the new instructor
            instructor = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            # Log the validation errors
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        # Supervisor logic
        if staff_member.is_supervisor:
            tracks = Track.objects.filter(supervisor=staff_member)
            if tracks.exists():
                track_data = []
                track_courses_data = []

                for track in tracks:
                    track_data.append({
                        "id": track.id,
                        "name": track.name,
                        "description": track.description,
                        "track_type": track.track_type,
                        "supervisor": staff_member.get_full_name(),
                        "supervisor_role": staff_member.get_role_display(),
                        "created_at": track.created_at
                    })

                    # Get courses in this track
                    track_courses = Course.objects.filter(tracks=track)
                    for course in track_courses:
                        course_track_names = [
                            {"id": t.id, "name": t.name} for t in course.tracks.all()
                        ]
                        instructor_info = {
                            "id": course.instructor.id if course.instructor else None,
                            "name": course.instructor.get_full_name() if course.instructor else 'No Instructor'
                        }

                        track_courses_data.append({
                            "id": course.id,
                            "name": course.name,
                            "description": course.description,
                            "created_at": course.created_at,
                            "instructor": instructor_info,
                            "tracks": course_track_names,
                        })

                taught_courses = Course.objects.filter(instructor=staff_member)
                taught_courses_serialized = CourseSerializer(taught_courses, many=True).data

                return Response({
                    "status": "success",
                    "tracks": track_data,
                    "track_courses": track_courses_data,
                    "taught_courses": taught_courses_serialized
                }, status=status.HTTP_200_OK)

            else:
                return Response({
                    "status": "success",
                    "message": "Supervisor has no tracks assigned.",
                    "tracks": [],
                    "track_courses": [],
                    "taught_courses": []
                }, status=status.HTTP_200_OK)

        # Instructor logic
        elif staff_member.is_instructor:
            courses = Course.objects.filter(instructor=staff_member)
            if courses.exists():
                course_data = CourseSerializer(courses, many=True).data

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
                }, status=status.HTTP_200_OK)

            else:
                return Response({
                    "status": "success",
                    "message": "Instructor has no courses assigned.",
                    "tracks": [],
                    "courses": []
                }, status=status.HTTP_200_OK)

        # Fallback if not supervisor or instructor
        return Response({
            "status": "success",
            "tracks": [],
            "track_courses": [],
            "taught_courses": []
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

#Return All Instructosfrom django.http import JsonResponse
from django.http import JsonResponse
from django.views import View
from .models import StaffMember

class InstructorListView(View):
    def get(self, request, *args, **kwargs):
        # Check if the request is for the current user's own data
        if request.GET.get('role') == 'me':
            staff_members = StaffMember.objects.filter(id=request.user.id)
        else:
            # Get role parameter from the request to filter by instructor or supervisor
            role = request.GET.get('role', None)
            
            # Filter staff based on role if provided, else return all instructors and supervisors
            if role:
                staff_members = StaffMember.objects.filter(role=role)
            else:
                staff_members = StaffMember.objects.filter(role__in=[StaffMember.Role.INSTRUCTOR, StaffMember.Role.SUPERVISOR])

        # Format the response data
        data = [
            {
                "id": staff.id,
                "username": staff.username,
                "full_name": staff.get_full_name(),
                "email": staff.email,
                "branch": staff.branch.name if staff.branch else None,
                "phone": staff.phone,
                "is_verified": staff.is_verified,
                "role": staff.get_role_display()  # Display role name
            }
            for staff in staff_members
        ]

        return JsonResponse(data, safe=False)
1