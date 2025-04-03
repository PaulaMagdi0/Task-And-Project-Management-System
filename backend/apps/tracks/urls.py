from django.urls import path
from .views import TrackListView, TrackCreateView, TrackUpdateView

urlpatterns = [
    path("", TrackListView.as_view(), name="track-list"),
    path("create/", TrackCreateView.as_view(), name="track-create"),
      path("<int:pk>/", TrackUpdateView.as_view(), name="track-update"),
]
