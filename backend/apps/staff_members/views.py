from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import StaffMemberSerializer, CreateSupervisorSerializer, ExcelUploadSupervisorSerializer, StaffMemberSerializer
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
from apps.courses.models import Course
import logging
logger = logging.getLogger(__name__)

class StaffMemberDeleteView(generics.DestroyAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    permission_classes = [IsAdminOrBranchManager]

class StaffMemberListCreateView(generics.ListCreateAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    permission_classes = []

    def perform_create(self, serializer):
        instance = serializer.save()
        if instance.role == StaffMember.Role.BRANCH_MANAGER and instance.branch:
            if instance.branch.manager and instance.branch.manager != instance:
                raise ValidationError("This branch already has a manager")
            instance.branch.manager = instance
            instance.branch.save()

class StaffMemberUpdateView(generics.RetrieveUpdateAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    permission_classes = []

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.role == StaffMember.Role.BRANCH_MANAGER and instance.branch:
            if instance.branch.manager and instance.branch.manager != instance:
                raise ValidationError("This branch already has a manager")
            instance.branch.manager = instance
            instance.branch.save()
        elif instance.role == StaffMember.Role.SUPERVISOR:
            if not instance.branch:
                raise ValidationError("Supervisors must be assigned to a branch")

class CreateStaffView(generics.CreateAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = CreateSupervisorSerializer
    permission_classes = []

    def perform_create(self, serializer):
        role = serializer.validated_data.get('role')
        # Allow SUPERVISOR, BRANCH_MANAGER, INSTRUCTOR
        valid_roles = [
            StaffMember.Role.SUPERVISOR,
            StaffMember.Role.BRANCH_MANAGER,
            StaffMember.Role.INSTRUCTOR
        ]
        if role not in valid_roles:
            raise ValidationError(f"Role must be one of {[r.value for r in valid_roles]}.")
        
        instance = serializer.save()
        # Ensure a branch is assigned for SUPERVISOR, BRANCH_MANAGER, or INSTRUCTOR
        if not instance.branch:
            raise ValidationError(f"{role} must be assigned to a branch.")

class CreateInstructorView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = CreateInstructorSerializer(data=request.data)
        if serializer.is_valid():
            instructor = serializer.save()
            return Response({
                "message": "Instructor created successfully.",
                "data": CreateInstructorSerializer(instructor).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SupervisorBulkUploadView(APIView):
    permission_classes = [IsAdminOrBranchManager]

    def post(self, request, *args, **kwargs):
        serializer = ExcelUploadSupervisorSerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = serializer.create(validated_data=serializer.validated_data)
                errors = []
                created_supervisors = result.get('created', [])
                for staff in created_supervisors:
                    if not staff.branch:
                        errors.append(f"Supervisor {staff.email} was not assigned to a branch")
                        staff.delete()
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
    staff_member = get_object_or_404(StaffMember, id=staff_id)

    if staff_member.role not in [StaffMember.Role.SUPERVISOR, StaffMember.Role.INSTRUCTOR]:
        return Response({"error": "You are not authorized to view this information."},
                        status=status.HTTP_403_FORBIDDEN)

    try:
        if staff_member.is_supervisor:
            tracks = Track.objects.filter(supervisor=staff_member)
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
            taught_courses_serialized = []
            for course in taught_courses:
                taught_courses_serialized.append({
                    "id": course.id,
                    "name": course.name,
                    "description": course.description,
                    "created_at": course.created_at,
                    "tracks": [{"id": t.id, "name": t.name} for t in course.tracks.all()],
                })

            return Response({
                "status": "success",
                "tracks": track_data,
                "track_courses": track_courses_data,
                "taught_courses": taught_courses_serialized
            }, status=status.HTTP_200_OK)

        elif staff_member.is_instructor:
            courses = Course.objects.filter(instructor=staff_member)
            course_data = []
            track_data = []

            if courses.exists():
                for course in courses:
                    course_data.append({
                        "id": course.id,
                        "name": course.name,
                        "description": course.description,
                        "created_at": course.created_at,
                        "instructor": staff_member.get_full_name(),
                        "instructor_role": staff_member.get_role_display(),
                        "tracks": [{"id": t.id, "name": t.name} for t in course.tracks.all()]
                    })

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

            unique_tracks = list({t['id']: t for t in track_data}.values())

            return Response({
                "status": "success",
                "tracks": unique_tracks,
                "courses": course_data
            }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class InstructorListView(View):
    def get(self, request, *args, **kwargs):
        if request.GET.get('role') == 'me':
            staff_members = StaffMember.objects.filter(id=request.user.id)
        else:
            role = request.GET.get('role', None)
            if role:
                staff_members = StaffMember.objects.filter(role=role)
            else:
                staff_members = StaffMember.objects.filter(role__in=[StaffMember.Role.INSTRUCTOR, StaffMember.Role.SUPERVISOR])

        data = [
            {
                "id": staff.id,
                "username": staff.username,
                "full_name": staff.get_full_name(),
                "email": staff.email,
                "branch": staff.branch.name if staff.branch else None,
                "phone": staff.phone,
                "is_verified": staff.is_verified,
                "role": staff.get_role_display()
            }
            for staff in staff_members
        ]

        return JsonResponse(data, safe=False)