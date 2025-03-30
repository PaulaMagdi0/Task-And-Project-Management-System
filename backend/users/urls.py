from django.urls import path
from .views import ProtectedView  # Add this import
from .views import RegisterView   # Keep any existing imports

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('protected/', ProtectedView.as_view(), name='protected'),
]