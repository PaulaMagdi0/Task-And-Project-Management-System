from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Initialize router with custom routes
router = DefaultRouter(trailing_slash=False)  # Remove trailing slashes
router.register(r'', views.BranchLocationViewSet, basename='branch')

# Custom URL patterns
urlpatterns = [
    # Include default router URLs
    path('', include(router.urls)),

    # Custom 'staff' action for a specific branch
    path('<int:pk>/staff/', 
         views.BranchLocationViewSet.as_view({'get': 'staff'}), 
         name='branch-staff-list'),

    # Custom 'active' action to get active branches
    path('active/', 
         views.BranchLocationViewSet.as_view({'get': 'active'}), 
         name='active-branches'),
    
    # Uncomment if you have a BranchStatsView for branch statistics
    # path('<int:pk>/stats/', 
    #      views.BranchStatsView.as_view(),
    #      name='branch-stats'),
]
