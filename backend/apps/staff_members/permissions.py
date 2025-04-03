from rest_framework import permissions
from django.utils.translation import gettext_lazy as _

class BaseRolePermission(permissions.BasePermission):
    """Base permission class for role-based access control."""
    
    role = None
    message = _('You do not have permission to perform this action.')
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            self.message = _('Authentication credentials were not provided.')
            return False
        
        # Ensure role is set in the derived classes
        if self.role and request.user.role != self.role:
            self.message = self.message  # Override the message from derived class
            return False
        
        return True

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

class IsBranchManager(BaseRolePermission):
    """Allows access only to branch managers."""
    role = "branch_manager"
    message = _('Only branch managers can perform this action.')

class IsSupervisor(BaseRolePermission):
    """Allows access only to supervisors."""
    role = "supervisor"
    message = _('Only supervisors can perform this action.')

class IsInstructor(BaseRolePermission):
    """Allows access only to instructors."""
    role = "instructor"
    message = _('Only instructors can perform this action.')

class IsAdminOrBranchManager(permissions.BasePermission):
    """Allows access to admins or branch managers."""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            self.message = _('Authentication credentials were not provided.')
            return False
        
        # Check if user is admin or branch manager
        if request.user.is_admin or request.user.role == "branch_manager":
            return True
        
        return False

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

class IsAdminOrSelf(BaseRolePermission):
    """Allows access to admins or the user themselves."""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # Admins can access any resource, while others can only access their own data
        if request.user.is_admin:
            return True
        
        return False

    def has_object_permission(self, request, view, obj):
        # Admin can access any object, self can access their own object
        return request.user.is_admin or obj == request.user
