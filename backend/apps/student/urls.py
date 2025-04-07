from django.urls import path
from . import views
from .views import StudentDashboardAPI

urlpatterns = [
    path('upload/', views.update_student, name='upload_student'),
    path('list/', views.list_students, name='list_students'),
    path('options/', views.show_options, name='show_options'),
    path('verify/<str:verification_code>/', views.verify_email, name='verify-email'),
    path('students/', views.list_students, name='list_students'),  # Changed from 'list_students/' to 'students/'
    path('dashboard/', StudentDashboardAPI.as_view(), name='student-dashboard'),
]
#   File "/home/mano/ITI/Graduation Project/Task-And-Project-Management-System/backend/env/lib/python3.12/site-packages/django/db/migrations/loader.py", line 327, in check_consistent_history
#     raise InconsistentMigrationHistory(
# django.db.migrations.exceptions.InconsistentMigrationHistory: Migration staff_members.0001_initial is applied before its dependency branch_location.0001_initial on database 'default'.