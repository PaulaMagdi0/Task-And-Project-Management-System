from django.urls import path
from .views import CourseListView, StaffMemberCoursesView # Ensure this view exists

urlpatterns = [
    path("", CourseListView.as_view(), name="course-list"),
    # path("<int:id>/", InstructorCoursesView.as_view(), name="course-detail"),
    path('staffmember/<int:staff_member_id>/courses/', StaffMemberCoursesView.as_view(), name='staffmember-courses'),
    # http://127.0.0.1:8000/api/courses/staffmember/2/courses/
]
