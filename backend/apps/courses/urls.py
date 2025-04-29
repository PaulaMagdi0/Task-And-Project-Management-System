from django.urls import path
from .views import AssignCourseToTrackView, CourseListView, StaffMemberCoursesView,AssignedCoursesInTrackView,CourseFilterView,ReassignCourseInstructorView# Ensure this view exists

urlpatterns = [
    path("", CourseListView.as_view(), name="course-list"),
    # path("<int:id>/", InstructorCoursesView.as_view(), name="course-detail"),
    path('staffmember/<int:staff_member_id>/courses/', StaffMemberCoursesView.as_view(), name='staffmember-courses'),
    # http://127.0.0.1:8000/api/courses/staffmember/2/courses/
    #Courses Avalible By Track AND user ID
    path('instructors/<int:user_id>/tracks/<int:track_id>/assigned_courses/', AssignedCoursesInTrackView.as_view(), name='assigned-courses-in-track'),
    path('courses/filter/', CourseFilterView.as_view(), name='course-filter'),
    path('reassign-instructor/<int:pk>/', ReassignCourseInstructorView.as_view(), name='reassign-course-instructor'),
    path("assign-course-to-track/",AssignCourseToTrackView.as_view(),name="assign-course-to-track")


]
