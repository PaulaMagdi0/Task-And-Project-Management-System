from django.urls import path
from .views import (
    upload_excel,
    list_students,
    verify_email,
    update_student,
    delete_student,
    StudentDashboardAPI,
    show_options,
    create_student_from_form,
    student_courses,
    StudentsByTrackAndCourseView,
    StudentsByStaffView
)

urlpatterns = [
    path('create/', create_student_from_form, name='create_student_form'), #Single
    path('upload/', upload_excel, name='upload_excel'),#File
    path('list/', list_students, name='list_students'),#Listing
    path('verify/<str:verification_code>/', verify_email, name='verify_email'),#Verifiy
    path('<int:student_id>/update/', update_student, name='update_student'),
    path('<int:student_id>/delete/', delete_student, name='delete_student'),
    path('dashboard/', StudentDashboardAPI.as_view(), name='student_dashboard'),
    path('options/', show_options, name='show_options'),
    path('<int:student_id>/courses/', student_courses, name='student_courses_by_id'), # By student ID
    path('tracks/<int:track_id>/courses/<int:course_id>/students/', StudentsByTrackAndCourseView.as_view(), name='course_and_students_by_track'),
    # returns Student For Tracks
    path('by-staff/<int:staff_id>/', StudentsByStaffView.as_view(), name='students-by-staff'),

]