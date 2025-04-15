from django.urls import path
from .views import InstructorAssignmentsView,AssignmentListView,upcoming_assignments,track_course_assignments,get_submitters,AvailableTracksByInstructorIdView,InstructorTracksWithCoursesView,AssignmentCreateView

urlpatterns = [
    path('', AssignmentListView.as_view(), name='assignment-list'),  # GET method
    path('create/', AssignmentCreateView.as_view(), name='assignment-create'),  # POST method
    #Upcoming deadline
    path('student/<int:student_id>/upcoming-assignments/', upcoming_assignments, name='upcoming_assignments'),
    #Assignment By Track and COurse ID 
    path('track/<int:track_id>/course/<int:course_id>/assignments/', track_course_assignments, name='track_course_assignments'),
        path(
        '<int:assignment_id>/track/<int:track_id>/course/<int:course_id>/submitters/',
        get_submitters,
        name='assignment-submitters'
    ),
    path('<int:track_id>/', AssignmentListView.as_view(), name='assignment-list'),
    path("instructor/<int:instructor_id>/tracks/", AvailableTracksByInstructorIdView.as_view(), name="instructor-tracks"),
    path("instructor/<int:instructor_id>/tracks-courses/", InstructorTracksWithCoursesView.as_view(), name="instructor-tracks-courses"),
    path('instructor/<int:instructor_id>/assignments/', InstructorAssignmentsView.as_view(), name='instructor-assignments'),


]
