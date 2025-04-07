# apps/staff_members/admin.py
from django.contrib import admin
from .models import StaffMember
from django.contrib.auth.admin import UserAdmin

class StaffMemberAdmin(UserAdmin):
    model = StaffMember
    list_display = ('username', 'first_name', 'last_name', 'email', 'role', 'is_verified', 'date_joined', 'branch')
    list_filter = ('role', 'is_verified', 'branch')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {
            'fields': ('username', 'password', 'first_name', 'last_name', 'email', 'phone', 'role', 'branch')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_verified', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important dates', {
            'fields': ('date_joined',)
        }),
    )

    add_fieldsets = (
        (None, {
            'fields': ('username', 'password1', 'password2', 'first_name', 'last_name', 'email', 'role', 'branch')
        }),
    )

    def save_model(self, request, obj, form, change):
        """Override save to handle branch manager assignment and validation."""
        if obj.role == StaffMember.Role.BRANCH_MANAGER and obj.branch:
            if obj.branch.manager and obj.branch.manager != obj:
                raise ValidationError(f"Branch '{obj.branch.name}' already has a manager.")
        super().save_model(request, obj, form, change)

admin.site.register(StaffMember, StaffMemberAdmin)
