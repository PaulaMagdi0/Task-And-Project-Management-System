# admin.py
from django.contrib import admin
from .models import AssignmentSubmission
from django.utils.translation import gettext_lazy as _

class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ('student', 'assignment', 'course', 'submission_date', 'file', 'file_url')
    list_filter = ('assignment', 'course', 'student')
    search_fields = ('student__username', 'assignment__title', 'course__name')
    readonly_fields = ('submission_date',)  # Make submission date read-only
    
    # Optional: Inline form for assignment submission (if needed)
    fieldsets = (
        (None, {
            'fields': ('student', 'assignment', 'course', 'file', 'file_url')
        }),
        (_('Date Information'), {
            'fields': ('submission_date',),
            'classes': ('collapse',),
        }),
    )
    
    # Customizing form behavior: For example, making file_url required if file is not uploaded
    def save_model(self, request, obj, form, change):
        if not obj.file and not obj.file_url:
            raise ValueError(_('You must provide either a file or a file URL.'))
        super().save_model(request, obj, form, change)
    
    # Optional: Custom method to show file or file_url in a user-friendly way
    def get_file_display(self, obj):
        if obj.file:
            return obj.file.name
        elif obj.file_url:
            return obj.file_url
        return _('No file submitted')
    get_file_display.short_description = _('Submitted File/URL')
    
    # Add the custom method to list_display
    list_display = ('student', 'assignment', 'course', 'submission_date', 'get_file_display')

# Register the model with custom admin
admin.site.register(AssignmentSubmission, AssignmentSubmissionAdmin)
