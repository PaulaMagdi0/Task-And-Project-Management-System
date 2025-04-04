# apps/grades/admin.py
from django.contrib import admin
from .models import Grade  # Import the Grade model

class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'assignment', 'score', 'feedback', 'graded_date', 'course', 'created_at')  # Fields to display
    search_fields = ('student__username', 'assignment__title', 'course__name')  # Search by student, assignment title, and course name
    list_filter = ('assignment', 'course', 'graded_date')  # Filter by assignment, course, and graded date
    ordering = ('-graded_date',)  # Order by graded date in descending order
    
    # You can add extra logic in the save_model method if needed.
    def save_model(self, request, obj, form, change):
        """Custom save method (if any validation or modification is needed before saving)"""
        super().save_model(request, obj, form, change)

admin.site.register(Grade, GradeAdmin)  # Register the Grade model with the custom admin class
