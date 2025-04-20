# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AssignmentSubmissionViewSet,
    AssignmentDetailView,
    AssignmentStudentDetailView,
    AssignmentReportView
)
# Initialize the DefaultRouter and register the viewset
router = DefaultRouter()
router.register(r'submissions', AssignmentSubmissionViewSet, basename='submission')


urlpatterns = [
    path('', include(router.urls)), 
    path('assignments/<int:assignment_id>/details/', AssignmentDetailView.as_view(), name='assignment-detail'),
    path('assignments/<int:assignment_id>/students/<int:student_id>/', 
       AssignmentStudentDetailView.as_view(), 
       name='assignment-student-detail'),
    path('assignments/<int:pk>/report/', 
        AssignmentReportView.as_view(), 
        name='assignment-report'
    ),
]
