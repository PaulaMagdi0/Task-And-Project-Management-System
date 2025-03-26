from django.urls import path
from .views import AssignmentListView

urlpatterns = [
    path("", AssignmentListView.as_view(), name="assignment-list"),
]
