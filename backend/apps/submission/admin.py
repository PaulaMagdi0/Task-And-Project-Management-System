from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from .models import AssignmentSubmission

class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ('student', 'assignment', 'course', 'submission_date', 'get_file_display')
    list_filter = ('assignment', 'course', 'student')
    search_fields = ('student__username', 'assignment__title', 'course__name')
    readonly_fields = ('submission_date',)

    fieldsets = (
        (None, {
            'fields': ('student', 'assignment', 'course', 'track', 'file', 'file_url')
        }),
        (_('Date Information'), {
            'fields': ('submission_date',),
            'classes': ('collapse',),
        }),
    )

    def save_model(self, request, obj, form, change):
        # Prevent duplicate submissions
        if not change:  # only applies to new entries
            existing = AssignmentSubmission.objects.filter(student=obj.student, assignment=obj.assignment)
            if existing.exists():
                raise ValueError(_('A submission for this student and assignment already exists. Please edit the existing submission instead.'))

        # Set track from student if not manually selected
        if obj.student:
            if obj.student.track and obj.track is None:
                obj.track = obj.student.track

        # Ensure file or file URL is provided
        if not obj.file and not obj.file_url:
            raise ValueError(_('You must provide either a file or a file URL.'))

        super().save_model(request, obj, form, change)

    def get_file_display(self, obj):
        if obj.file:
            return obj.file.name
        elif obj.file_url:
            return obj.file_url
        return _('No file submitted')

    get_file_display.short_description = _('Submitted File/URL')

admin.site.register(AssignmentSubmission, AssignmentSubmissionAdmin)
