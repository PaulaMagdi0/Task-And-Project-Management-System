from django.urls import path
from .views import GradeListView

urlpatterns = [
    path("", GradeListView.as_view(), name="grade-list"),
]
