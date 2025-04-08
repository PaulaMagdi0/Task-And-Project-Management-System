from django.urls import path
from .views import TrackListView, TrackDetailView , TrackCoursesView

urlpatterns = [
    # List all tracks or create a new track
    path('', TrackListView.as_view(), name='track-list'),

    # Retrieve, update, or delete a specific track
    path('<int:pk>/', TrackDetailView.as_view(), name='track-detail'),
    
    path('<int:track_id>/courses/', TrackCoursesView.as_view(), name='track-courses'),

]
