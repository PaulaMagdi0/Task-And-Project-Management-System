from django.urls import path
from .views import CourseListView  # Ensure this view exists

urlpatterns = [
    path("", CourseListView.as_view(), name="course-list"),
]
