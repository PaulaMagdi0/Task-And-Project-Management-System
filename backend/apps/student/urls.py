from django.urls import path
from . import views

urlpatterns = [
    path('', views.upload_excel, name='upload_excel'),
    path('list_students/', views.list_students, name='list_students'),
    path('verify/<str:verification_code>/', views.verify_email, name='verify-email'),

]
