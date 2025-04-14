from django.contrib import admin
from .models import Course, CourseTrack
from apps.tracks.models import Track  # Import Track model to ensure proper linking

class CourseTrackInline(admin.TabularInline):
    model = CourseTrack  # Specify the intermediary model
    extra = 1  # Allow adding one additional track by default

class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'instructor', 'get_tracks')
    list_filter = ('tracks',)

    # Inline the custom through model
    inlines = [CourseTrackInline]

    def get_tracks(self, obj):
        return ", ".join([track.name for track in obj.tracks.all()])
    get_tracks.short_description = 'Tracks'

admin.site.register(Course, CourseAdmin)
