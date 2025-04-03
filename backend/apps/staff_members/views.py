from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import StaffMember
from .serializers import StaffMemberSerializer
from django.core.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
class StaffMemberListCreateView(generics.ListCreateAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter based on user role"""
        user = self.request.user
        
        if user.is_superuser:
            return StaffMember.objects.all()
        if user.is_supervisor:
            return StaffMember.objects.filter(role__in=['instructor', 'supervisor'])
        if user.is_branch_manager:
            return StaffMember.objects.filter(branch_location=user.branch_location)
        return StaffMember.objects.filter(pk=user.pk)

    def perform_create(self, serializer):
        """Handle staff creation with permission checks"""
        if not self.request.user.is_superuser and not self.request.user.is_supervisor:
            raise PermissionDenied("Only admins and supervisors can create staff accounts")
        
        # Set default branch location for branch managers
        if serializer.validated_data.get('role') == StaffMember.Role.BRANCH_MANAGER:
            if not serializer.validated_data.get('branch_location'):
                if self.request.user.is_branch_manager:
                    serializer.validated_data['branch_location'] = self.request.user.branch_location
        
        serializer.save(is_active=True)

class StaffMemberRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Get staff member with permission check"""
        obj = super().get_object()
        user = self.request.user
        
        # Admins can access any staff
        if user.is_superuser:
            return obj
            
        # Supervisors can access instructors and other supervisors
        if user.is_supervisor and obj.role in ['instructor', 'supervisor']:
            return obj
            
        # Branch managers can access staff in their branch
        if user.is_branch_manager and obj.branch_location == user.branch_location:
            return obj
            
        # Users can always access their own profile
        if obj == user:
            return obj
            
        raise PermissionDenied("You don't have permission to access this staff member")

    def perform_update(self, serializer):
        """Handle updates with permission checks"""
        if not self.request.user.is_superuser:
            # Prevent role changes by non-admins
            if 'role' in serializer.validated_data:
                if serializer.validated_data['role'] != serializer.instance.role:
                    raise PermissionDenied("Only admins can change roles")
            
            # Prevent branch location changes by non-admins
            if 'branch_location' in serializer.validated_data:
                if self.request.user.branch_location != serializer.validated_data['branch_location']:
                    raise PermissionDenied("You can't change branch locations")

        serializer.save()

    def perform_destroy(self, instance):
        """Handle deletion with permission checks"""
        if not self.request.user.is_superuser:
            raise PermissionDenied("Only admins can delete staff accounts")
        if instance == self.request.user:
            raise PermissionDenied("You cannot delete your own account")
        instance.delete()

class CurrentStaffMemberView(generics.RetrieveUpdateAPIView):
    serializer_class = StaffMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        """Prevent users from changing sensitive fields on their own profile"""
        if 'role' in serializer.validated_data:
            serializer.validated_data.pop('role')
        if 'branch_location' in serializer.validated_data and not self.request.user.is_superuser:
            serializer.validated_data.pop('branch_location')
        serializer.save()