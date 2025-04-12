from django.contrib import admin
from .models import Grade
from apps.submission.models import AssignmentSubmission

class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'assignment', 'score', 'feedback', 'graded_date', 'course', 'created_at')
    search_fields = ('student__username', 'assignment__title', 'course__name')
    list_filter = ('assignment', 'course', 'graded_date')
    ordering = ('-graded_date',)
    
    # Use this to exclude the fields from the form in the admin interface
    exclude = ('track', 'submission')  # Hide the track and submission fields
    
    def save_model(self, request, obj, form, change):
        # Automatically assign the track and submission in the save method
        obj.clean()  # Ensures clean() validation is run before saving
        super().save_model(request, obj, form, change)

# Register the Grade model with custom admin
admin.site.register(Grade, GradeAdmin)