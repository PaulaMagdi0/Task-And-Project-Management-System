from django.urls import path
from .views import (
    StaffMemberListCreateView,
    StaffMemberUpdateView,
    CreateSupervisorView,
    SupervisorBulkUploadView,
)

urlpatterns = [
    path("", StaffMemberListCreateView.as_view(), name="staff-list"),
    path("create/", CreateSupervisorView.as_view(), name="create-supervisor"),
    path("bulk-upload/", SupervisorBulkUploadView.as_view(), name="bulk-upload-supervisors"),
    path("<int:pk>/", StaffMemberUpdateView.as_view(), name="staff-update"),
]
