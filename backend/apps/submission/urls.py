from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AssignmentSubmissionViewSet,
    AssignmentDetailView,
    AssignmentStudentDetailView,
    AssignmentReportView,
    SubmissionByStudentAssignmentView,
    AssignmentSubmissionNoFileViewSet  # Make sure this is imported
)
from django.http import HttpResponse
router = DefaultRouter()
router.register(r'submissions', AssignmentSubmissionViewSet, basename='submission')

def test_view(request):
    return HttpResponse("URL Working!", content_type="text/plain")

urlpatterns = [
    path('', include(router.urls)),
    path('instructor/', SubmissionByStudentAssignmentView.as_view(), name='submission-by-student-assignment'),
    path('assignments/<int:assignment_id>/details/', AssignmentDetailView.as_view(), name='assignment-detail'),
    path('assignments/<int:assignment_id>/students/<int:student_id>/', 
        AssignmentStudentDetailView.as_view(), 
        name='assignment-student-detail'),
    path('assignments/<int:pk>/report/', 
        AssignmentReportView.as_view(), 
        name='assignment-report'),
    
    # Submit assignment without file
    path('submit/', AssignmentSubmissionNoFileViewSet.as_view(), name='assignment_submission_no_file'),

    # URL for updating a submission
    path('submission/<int:pk>/', AssignmentSubmissionNoFileViewSet.as_view(), name='assignment-submission-update'),

    # URL for getting assignment submission details
        path('assignment/<int:assignment_id>/', 
        AssignmentSubmissionNoFileViewSet.as_view(), 
        name='validate-submission-by-assignment'),
]
