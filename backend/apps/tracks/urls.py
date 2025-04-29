from django.urls import path
from .views import TrackListView, TrackDetailView , TrackCoursesView,AvailableTracksView,remove_course_from_track

urlpatterns = [
    # List all tracks or create a new track
    path('', TrackListView.as_view(), name='track-list'),

    # Retrieve, update, or delete a specific track
    path('<int:pk>/', TrackDetailView.as_view(), name='track-detail'),
    
    path('<int:track_id>/courses/', TrackCoursesView.as_view(), name='track-courses'),
    # AvailableTracksView for supervisor/Instructor
    path('instructors/<int:user_id>/available_tracks/', AvailableTracksView.as_view(), name='available-tracks'),
    # remove cours from Track
    path("remove-course-from-track/track/<int:track_id>/course/<int:course_id>/", remove_course_from_track, name="remove-course-from-track")

]
