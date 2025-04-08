from django.urls import path
from .views import (
    upload_excel,
    list_students,
    verify_email,
    update_student,
    delete_student,
    StudentDashboardAPI,
    show_options
)

urlpatterns = [
    path('upload/', upload_excel, name='upload_excel'),
    path('list/', list_students, name='list_students'),
    path('verify/<str:verification_code>/', verify_email, name='verify_email'),
    path('<int:student_id>/update/', update_student, name='update_student'),
    path('<int:student_id>/delete/', delete_student, name='delete_student'),
    path('dashboard/', StudentDashboardAPI.as_view(), name='student_dashboard'),
    path('options/', show_options, name='show_options'),
]
