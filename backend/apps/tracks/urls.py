from django.urls import path
from .views import TrackListView

urlpatterns = [
    path("", TrackListView.as_view(), name="track-list"),
]
