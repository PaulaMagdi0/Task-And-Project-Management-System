from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentSubmissionViewSet

# Initialize the DefaultRouter and register the viewset
router = DefaultRouter()
router.register(r'submissions', AssignmentSubmissionViewSet, basename='assignment-submission')

urlpatterns = [
    path('', include(router.urls)),  # Automatically includes the URLs registered by the router
]
