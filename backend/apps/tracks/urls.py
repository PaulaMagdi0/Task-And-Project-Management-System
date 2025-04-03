from django.urls import path
from .views import TrackListView, TrackDetailView

urlpatterns = [
    path("", TrackListView.as_view(), name="track-list"),
    path("<int:pk>/", TrackDetailView.as_view(), name="track-detail"),  # Supports GET, PUT, PATCH, DELETE
]
