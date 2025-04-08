# apps/branch_location/admin.py
from django.contrib import admin
from .models import Branch  # Import the Branch model

class BranchAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'city', 'state', 'manager', 'created_at', 'updated_at')  # Fields to display
    search_fields = ('name', 'code', 'city', 'state')  # Add search functionality for these fields
    list_filter = ('city', 'state', 'manager')  # Filter by city, state, and manager
    ordering = ('name',)  # Order by name alphabetically

    # Display full address and staff information
    readonly_fields = ('full_address', 'manager_info', 'supervisors_info', 'get_staff_member_info')
    
    # Customize the form layout or inlines if needed (e.g., inline for related models)
    # For example, you can add inlines for related staff members, if applicable.

    def full_address(self, obj):
        return obj.full_address  # Display full address as a read-only field
    full_address.short_description = 'Full Address'

    def manager_info(self, obj):
        return obj.manager_info if obj.manager else "No Manager"  # Display manager info as a read-only field
    manager_info.short_description = 'Manager Info'

    def supervisors_info(self, obj):
        return obj.supervisors_info if obj.supervisors.exists() else "No Supervisors"  # Display supervisors info as a read-only field
    supervisors_info.short_description = 'Supervisors Info'

    def get_staff_member_info(self, obj):
        return obj.get_staff_member_info()  # Display staff member info as a read-only field
    get_staff_member_info.short_description = 'Staff Member Info'

admin.site.register(Branch, BranchAdmin)  # Register Branch model with the custom admin class
