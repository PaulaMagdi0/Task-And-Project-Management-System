# admin.py
from django.contrib import admin
from .models import Track
from django.utils.translation import gettext_lazy as _

class TrackAdmin(admin.ModelAdmin):
    list_display = ('name', 'track_type', 'supervisor', 'branch', 'created_at')
    list_filter = ('track_type', 'supervisor', 'branch')
    search_fields = ('name', 'supervisor__username', 'branch__name')
    
    # Display supervisor's full name and branch name in the list
    def get_supervisor_full_name(self, obj):
        return obj.supervisor.get_full_name() if obj.supervisor else _('No Supervisor')
    get_supervisor_full_name.short_description = _('Supervisor')
    
    def get_branch_name(self, obj):
        return obj.branch.name if obj.branch else _('No Branch')
    get_branch_name.short_description = _('Branch')
    
    # Update list_display to include the custom methods
    list_display = ('name', 'track_type', 'get_supervisor_full_name', 'get_branch_name', 'created_at')

    # Ensure that when saving a track, supervisor must have the "supervisor" role
    def save_model(self, request, obj, form, change):
        if obj.supervisor and obj.supervisor.role != "supervisor":
            raise ValueError(_('Assigned user must have the role "supervisor".'))
        super().save_model(request, obj, form, change)

    # Adding fieldsets to organize form fields
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'track_type', 'supervisor', 'branch')
        }),
        (_('Date Information'), {
            'fields': ('created_at',),
            'classes': ('collapse',),
        }),
    )
    
# Register the Track model with custom admin
admin.site.register(Track, TrackAdmin)
