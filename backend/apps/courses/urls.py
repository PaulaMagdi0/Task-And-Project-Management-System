from django.urls import path
from .views import (
    AssignCourseToTrackView,
    CourseListView,
    StaffMemberCoursesView,
    AssignedCoursesInTrackView,
    CourseFilterView,
    ReassignCourseInstructorView,
    CourseDetailView,  # Add new view
)

urlpatterns = [
    path("", CourseListView.as_view(), name="course-list"),
    path("<int:pk>/", CourseDetailView.as_view(), name="course-detail"),  # New path for GET/PATCH/DELETE
    path("staffmember/<int:staff_member_id>/courses/", StaffMemberCoursesView.as_view(), name="staffmember-courses"),
    path("instructors/<int:user_id>/tracks/<int:track_id>/assigned_courses/", AssignedCoursesInTrackView.as_view(), name="assigned-courses-in-track"),
    path("courses/filter/", CourseFilterView.as_view(), name="course-filter"),
    path("reassign-instructor/<int:pk>/", ReassignCourseInstructorView.as_view(), name="reassign-course-instructor"),
    path("assign-course-to-track/", AssignCourseToTrackView.as_view(), name="assign-course-to-track"),
]