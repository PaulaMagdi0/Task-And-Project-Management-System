from django.urls import path
from .views import AssignmentListView,upcoming_assignments,track_course_assignments,get_submitters

urlpatterns = [
    path("", AssignmentListView.as_view(), name="assignment-list"),
    #Upcoming deadline
    path('student/<int:student_id>/upcoming-assignments/', upcoming_assignments, name='upcoming_assignments'),
    #Assignment By Track and COurse ID 
    path('track/<int:track_id>/course/<int:course_id>/assignments/', track_course_assignments, name='track_course_assignments'),
        path(
        '<int:assignment_id>/track/<int:track_id>/course/<int:course_id>/submitters/',
        get_submitters,
        name='assignment-submitters'
    ),

]
