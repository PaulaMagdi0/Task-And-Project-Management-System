from django.contrib import admin
from .models import AssignmentSubmission
from django.utils.translation import gettext_lazy as _
from django.contrib import admin
from .models import AssignmentSubmission
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ('student', 'assignment', 'course', 'submission_date', 'get_file_display')
    list_filter = ('assignment', 'course', 'student')
    search_fields = ('student__username', 'assignment__title', 'course__name')
    readonly_fields = ('submission_date',)

    # Optional: Inline form for assignment submission
    fieldsets = (
        (None, {
            'fields': ('student', 'assignment', 'course', 'file', 'file_url')
        }),
        (_('Date Information'), {
            'fields': ('submission_date',),
            'classes': ('collapse',),
        }),
    )

    def save_model(self, request, obj, form, change):
        # Set the track based on the student
        if obj.student:
            print(f"Saving submission for student: {obj.student.username}")
            print(f"Student Track: {obj.student.track.id if obj.student.track else 'No track assigned'}")
            
            # Set the track field from the student's track if it's not already set
            if obj.student.track and obj.track is None:  # Only set if the track is not already assigned
                obj.track = obj.student.track
                print(f"Track set to: {obj.track.id}")
        
        # Ensure file or file URL is provided
        if not obj.file and not obj.file_url:
            raise ValueError(_('You must provide either a file or a file URL.'))

        # Save the object
        super().save_model(request, obj, form, change)
    # Optional: Custom method to show file or file_url in a user-friendly way
    def get_file_display(self, obj):
        if obj.file:
            return obj.file.name
        elif obj.file_url:
            return obj.file_url
        return _('No file submitted')

    get_file_display.short_description = _('Submitted File/URL')

# Register the model with custom admin
admin.site.register(AssignmentSubmission, AssignmentSubmissionAdmin)
