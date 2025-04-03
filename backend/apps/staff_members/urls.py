from django.urls import path
from .views import (
    StaffMemberListCreateView,
    StaffMemberRetrieveUpdateDestroyView,
    CurrentStaffMemberView
)

urlpatterns = [
    # List and create staff members
    path("", StaffMemberListCreateView.as_view(), name="staff-list-create"),
    
    # Retrieve, update, or delete specific staff member
    path("<int:pk>/", StaffMemberRetrieveUpdateDestroyView.as_view(), 
         name="staff-retrieve-update-destroy"),
    
    # Current user's profile
    path("me/", CurrentStaffMemberView.as_view(), name="current-staff"),
]

# GET /staff/ - List all visible staff members

# GET /staff/<id>/ - Get specific staff member

# POST /staff/ - Create new staff member

# PUT/PATCH /staff/<id>/ - Update staff member

# DELETE /staff/<id>/ - Delete staff member