# apps/assignments/admin.py
from django.contrib import admin
from .models import Assignment  # Import the Assignment model

class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'assignment_type', 'due_date', 'end_date', 'created_at')  # Fields to display
    search_fields = ('title', 'course__name', 'assignment_type')  # Search by title, course name, and type
    list_filter = ('assignment_type', 'course')  # Filter by assignment type and course
    ordering = ('-created_at',)  # Order by creation date in descending order
    
    # Read-only fields to display additional information (e.g., file URL)
    readonly_fields = ('file', 'file_url')

    def save_model(self, request, obj, form, change):
        """Custom save method (if any validation or modification is needed before saving)"""
        # You can add extra logic here if needed
        super().save_model(request, obj, form, change)

admin.site.register(Assignment, AssignmentAdmin)  # Register the Assignment model with the custom admin class
