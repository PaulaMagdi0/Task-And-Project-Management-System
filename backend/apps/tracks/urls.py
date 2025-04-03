from django.urls import path
from .views import TrackListView, TrackDetailView

urlpatterns = [
    # List all tracks or create a new track
    path('', TrackListView.as_view(), name='track-list'),

    # Retrieve, update, or delete a specific track
    path('<int:pk>/', TrackDetailView.as_view(), name='track-detail'),
]
