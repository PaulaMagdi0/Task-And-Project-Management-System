from rest_framework import permissions
from django.utils.translation import gettext_lazy as _
from apps.staff_members.models import StaffMember

class BaseRolePermission(permissions.BasePermission):
    """Base permission class for role-based access control."""
    
    allowed_roles = None  # Should be set in child classes
    message = _('You do not have permission to perform this action.')
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            self.message = _('Authentication credentials were not provided.')
            return False
        
        if self.allowed_roles is None:
            raise NotImplementedError(
                f"{self.__class__.__name__} must define 'allowed_roles'"
            )
        
        # Get role safely (avoid AnonymousUser issues)
        user_role = getattr(request.user, "role", None)
        user_branch = getattr(request.user, "branch", None)

        # Check if user has any of the allowed roles
        if user_role in self.allowed_roles:
            return True
        
        # Fallback to checking groups if role field doesn't exist
        if request.user.groups.filter(name__in=self.allowed_roles).exists():
            return True
            
        # Check for superuser status if specified
        if StaffMember.Role.ADMIN in self.allowed_roles and request.user.is_superuser:
            return True
            
        return False

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsBranchManager(BaseRolePermission):
    """Allows access only to branch managers."""
    allowed_roles = [StaffMember.Role.BRANCH_MANAGER, StaffMember.Role.ADMIN]
    message = _('Only branch managers can perform this action.')


class IsSupervisor(BaseRolePermission):
    """Allows access only to supervisors."""
    allowed_roles = [StaffMember.Role.SUPERVISOR, StaffMember.Role.ADMIN]
    message = _('Only supervisors can perform this action.')


class IsInstructor(BaseRolePermission):
    """Allows access only to instructors."""
    allowed_roles = [StaffMember.Role.INSTRUCTOR, StaffMember.Role.ADMIN]
    message = _('Only instructors can perform this action.')


class IsAdminOrBranchManager(permissions.BasePermission):
    """Allows access to admins or branch managers."""
    message = _('Only administrators or branch managers can perform this action.')
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        user_role = getattr(request.user, "role", None)

        return (
            request.user.is_superuser or 
            user_role == StaffMember.Role.BRANCH_MANAGER or
            request.user.groups.filter(name=StaffMember.Role.BRANCH_MANAGER).exists()
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsAdminOrSelf(permissions.BasePermission):
    """Allows access to admins or the user themselves."""
    message = _('You can only access your own data unless you are an administrator.')
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        user_id = str(request.user.id)
        
        # Check if trying to access own data (for list views)
        if 'pk' in view.kwargs:
            return user_id == view.kwargs['pk']
            
        return request.user.is_superuser

    def has_object_permission(self, request, view, obj):
        # For object-level permissions
        if hasattr(obj, 'user'):
            return request.user.is_superuser or obj.user == request.user
        return request.user.is_superuser or obj == request.user


class IsStudentManager(permissions.BasePermission):
    """Allows access to admin, supervisor, or branch manager roles."""
    message = _('Only student managers can perform this action.')
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        user_role = getattr(request.user, "role", None)

        return (
            request.user.is_superuser or
            user_role in [
                StaffMember.Role.ADMIN, StaffMember.Role.SUPERVISOR, StaffMember.Role.BRANCH_MANAGER
            ] or
            request.user.groups.filter(
                name__in=[StaffMember.Role.ADMIN, StaffMember.Role.SUPERVISOR, StaffMember.Role.BRANCH_MANAGER]
            ).exists()
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

# ✅ FIXED FUNCTION: No more AnonymousUser issues
def has_student_management_permission(user):
    print(f"DEBUG: User Info - ID: {user.id}, Role: {getattr(user, 'role', None)}, Branch: {getattr(user, 'branch', None)}, Superuser: {user.is_superuser}")
    return (
        user.is_superuser or 
        getattr(user, 'role', None) in ['admin', 'supervisor', 'branch_manager']
    )
