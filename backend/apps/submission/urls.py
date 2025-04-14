from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentSubmissionViewSet,AssignmentDetailView

# Initialize the DefaultRouter and register the viewset
router = DefaultRouter()
router.register(r'', AssignmentSubmissionViewSet, basename='assignment-submission')

urlpatterns = [
    path('', include(router.urls)),  # Automatically includes the URLs registered by the router
    #get assignmentData and who submitted the assignment By assignment ID
    path('assignments/<int:assignment_id>/details/', AssignmentDetailView.as_view(), name='assignment-detail'),

]
