from django.urls import path
from . import views
from .views import StudentDashboardAPI

urlpatterns = [
    path('upload/', views.upload_student, name='upload_student'),
    path('list/', views.list_students, name='list_students'),
    path('options/', views.show_options, name='show_options'),
    path('verify/<str:verification_code>/', views.verify_email, name='verify-email'),
    path('students/', views.list_students, name='list_students'),  # Changed from 'list_students/' to 'students/'

]