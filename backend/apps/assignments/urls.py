from django.urls import path
from .views import AssignmentListView,upcoming_assignments

urlpatterns = [
    path("", AssignmentListView.as_view(), name="assignment-list"),
    path('student/<int:student_id>/upcoming-assignments/', upcoming_assignments, name='upcoming_assignments'),

]
