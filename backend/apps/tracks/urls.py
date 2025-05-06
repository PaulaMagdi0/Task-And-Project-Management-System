from django.urls import path
from .views import (
    TrackListView,
    TrackDetailView,
    TrackCoursesView,
    AvailableTracksView,
    remove_course_from_track,
    IntakeTrackListView,
    AvailableIntakesForTrackView,
)

urlpatterns = [
    path('', TrackListView.as_view(), name='track-list'),
    path('<int:pk>/', TrackDetailView.as_view(), name='track-detail'),
    path('<int:pk>/available_intakes/', AvailableIntakesForTrackView.as_view(), name='track-available-intakes'),
    path('<int:track_id>/courses/', TrackCoursesView.as_view(), name='track-courses'),
    path('instructors/<int:user_id>/available_tracks/', AvailableTracksView.as_view(), name='available-tracks'),
    path("remove-course-from-track/track/<int:track_id>/course/<int:course_id>/", remove_course_from_track, name="remove-course-from-track"),
    path('intakes/<int:intake_id>/tracks/', IntakeTrackListView.as_view(), name='intake-track-list'),
]