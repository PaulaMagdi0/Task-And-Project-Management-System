from django.contrib import admin
from .models import Assignment  # Import the Assignment model

class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'assignment_type', 'assigned_to', 'due_date', 'end_date', 'created_at')  # Fields to display, added 'assigned_to'
    search_fields = ('title', 'course__name', 'assignment_type', 'assigned_to__full_name')  # Search by title, course name, type, and assigned student's full name
    list_filter = ('assignment_type', 'course', 'assigned_to')  # Filter by assignment type, course, and assigned student
    ordering = ('-created_at',)  # Order by creation date in descending order
    
    # Read-only fields to display additional information (e.g., file URL)
    readonly_fields = ('file', 'file_url')

    def save_model(self, request, obj, form, change):
        """Custom save method (if any validation or modification is needed before saving)"""
        # You can add extra logic here if needed
        super().save_model(request, obj, form, change)

admin.site.register(Assignment, AssignmentAdmin)  # Register the Assignment model with the custom admin class
