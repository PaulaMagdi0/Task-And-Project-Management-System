from django.urls import path
from .views import GradeListView, GradeDetailView, StudentGradeListView

urlpatterns = [
    path("", GradeListView.as_view(), name="grade-list"),
    path("<int:studentid>/", StudentGradeListView.as_view(), name="student-grade-list"),
    path("detail/<int:id>/", GradeDetailView.as_view(), name="grade-detail"),
]
