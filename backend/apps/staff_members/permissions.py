from rest_framework import permissions

class IsBranchManager(permissions.BasePermission):
    """Allows only branch managers to add/remove supervisors."""
    
    def has_permission(self, request, view):
        return request.user.role == "branch_manager"

class IsSupervisor(permissions.BasePermission):
    """Allows only supervisors to add/remove instructors and tasks."""
    
    def has_permission(self, request, view):
        return request.user.role == "supervisor"

class IsInstructor(permissions.BasePermission):
    """Allows instructors to only add tasks."""
    
    def has_permission(self, request, view):
        return request.user.role == "instructor"
