from django.urls import path
from .views import (
    InstructorAssignmentsView,
    AssignmentListView,
    upcoming_assignments,
    track_course_assignments,
    get_submitters,
    AvailableTracksByInstructorIdView,
    InstructorTracksWithCoursesView,
    AssignmentCreateView,
    AssignmentDetailView,  # NEW: Import the detail view
    IntakeAssignmentListView,

)

urlpatterns = [
    # Basic assignment operations
    path('', AssignmentListView.as_view(), name='assignment-list'),  # GET all
    path('create/', AssignmentCreateView.as_view(), name='assignment-create'),  # POST
    path('<int:pk>/', AssignmentDetailView.as_view(), name='assignment-detail'),  # NEW: PUT/PATCH/DELETE
    path('<int:track_id>/', AssignmentListView.as_view(), name='assignment-list-by-track'),

    # Student-specific endpoints
    path('student/<int:student_id>/upcoming-assignments/', upcoming_assignments, name='upcoming_assignments'),
    
    # Track/Course assignments
    path('track/<int:track_id>/course/<int:course_id>/assignments/', track_course_assignments, name='track_course_assignments'),
    
    # Submission tracking
    path(
        '<int:assignment_id>/track/<int:track_id>/course/<int:course_id>/submitters/',
        get_submitters,
        name='assignment-submitters'
    ),
    
    # Instructor-related endpoints
    path("instructor/<int:instructor_id>/tracks/", AvailableTracksByInstructorIdView.as_view(), name="instructor-tracks"),
    path("instructor/<int:instructor_id>/tracks-courses/", InstructorTracksWithCoursesView.as_view(), name="instructor-tracks-courses"),
    path('instructor/<int:instructor_id>/assignments/', InstructorAssignmentsView.as_view(), name='instructor-assignments'),
    path('intakes/<int:intake_id>/assignments/', IntakeAssignmentListView.as_view(), name='intake-assignment-list'),
]