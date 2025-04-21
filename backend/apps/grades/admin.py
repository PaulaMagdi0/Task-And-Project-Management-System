from django.contrib import admin
from django.core.exceptions import ValidationError
from .models import Grade
from apps.submission.models import AssignmentSubmission
from apps.student.models import Student
from apps.assignments.models import Assignment
from django.utils.timezone import now
import logging

# Define the logger
logger = logging.getLogger(__name__)

class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'assignment', 'score', 'feedback', 'graded_date', 'course', 'track', 'created_at')
    search_fields = ('student__username', 'assignment__title', 'course__name', 'track__name')
    list_filter = ('assignment', 'course', 'track', 'graded_date')
    ordering = ('-graded_date',)
    
    # Show track and course fields in the form
    fieldsets = (
        (None, {
            'fields': ('student', 'assignment', 'submission', 'score', 'feedback', 'course', 'track')
        }),
        ('Dates', {
            'fields': ('graded_date', 'created_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        """Ensure track from student and course from selected course are populated before saving"""
        if not obj.submission:
            raise ValidationError("No submission found for this grade.")
        
        # Find the related submission
        submission = AssignmentSubmission.objects.filter(
            student=obj.student,
            assignment=obj.assignment,
            course=obj.course  # Ensure it is for the right course
        ).first()
        
        if not submission:
            raise ValidationError(f"Submission for student '{obj.student.username}' not found for the specified assignment and course.")
        
        # Automatically fill course from selected course and track from student's track
        if not obj.course:
            obj.course = submission.course  # Set course from submission

        if not obj.track:
            if obj.student.track:
                obj.track = obj.student.track  # Set track from student's track
            else:
                raise ValidationError(f"Student '{obj.student.username}' does not have a track associated with their profile.")
        
        # Run full clean and save
        obj.full_clean()  # Ensure all validations pass
        super().save_model(request, obj, form, change)

# Register the Grade model with custom admin
admin.site.register(Grade, GradeAdmin)
