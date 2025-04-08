from django.urls import path
from .views import (
    StaffMemberListCreateView,
    StaffMemberUpdateView,
    CreateSupervisorView,
    SupervisorBulkUploadView,
    StaffMemberDeleteView,
)

urlpatterns = [
    # List and create staff members
    path('', StaffMemberListCreateView.as_view(), name='staff-list'),

    # Create supervisor (branch manager functionality)
    path('create/', CreateSupervisorView.as_view(), name='create-supervisor'),

    # Bulk upload supervisors via Excel
    path('bulk-upload/', SupervisorBulkUploadView.as_view(), name='bulk-upload-supervisors'),

    # Update staff member by ID
    path('<int:pk>/', StaffMemberUpdateView.as_view(), name='staff-update'),
    path('<int:pk>/delete/', StaffMemberDeleteView.as_view(), name='staff-delete'),
]
