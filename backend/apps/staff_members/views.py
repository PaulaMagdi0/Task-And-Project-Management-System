from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import StaffMemberSerializer, CreateSupervisorSerializer, ExcelUploadSupervisorSerializer,StaffMemberSerializer
from rest_framework.permissions import IsAuthenticated
from apps.staff_members.models import StaffMember
from apps.staff_members.permissions import IsAdminOrBranchManager
from rest_framework.exceptions import ValidationError

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
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAdminOrBranchManager]

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
