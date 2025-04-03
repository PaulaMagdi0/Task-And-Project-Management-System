# branch_location/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Initialize router with custom routes
router = DefaultRouter(trailing_slash=False)  # Remove trailing slashes
router.register(r'branches', views.BranchLocationViewSet, basename='branch')

# Custom URL patterns
custom_urlpatterns = [
    path('branches/<int:pk>/staff/', 
         views.BranchLocationViewSet.as_view({'get': 'staff'}), 
         name='branch-staff-list'),
    path('branches/active/', 
         views.BranchLocationViewSet.as_view({'get': 'active'}), 
         name='active-branches'),
    path('branches/<int:pk>/stats/',
         views.BranchStatsView.as_view(),
         name='branch-stats'),
]
