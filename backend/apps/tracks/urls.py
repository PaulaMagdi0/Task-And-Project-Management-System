from django.urls import path
from .views import TrackListView, TrackCreateView

urlpatterns = [
    path("", TrackListView.as_view(), name="track-list"),
    path("create/", TrackCreateView.as_view(), name="track-create"),
]
