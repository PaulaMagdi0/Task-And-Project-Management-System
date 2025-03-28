from django.urls import path
from .views import StaffMemberListCreateView, StaffMemberUpdateView

urlpatterns = [
    path("", StaffMemberListCreateView.as_view(), name="staff-list"),
    path("<int:pk>/", StaffMemberUpdateView.as_view(), name="staff-update"),  # Update endpoint
]
