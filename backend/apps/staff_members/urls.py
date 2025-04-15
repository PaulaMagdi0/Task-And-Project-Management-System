from django.urls import path
from .views import (
    StaffMemberListCreateView,
    StaffMemberUpdateView,
    CreateSupervisorView,
    StaffMemberDeleteView,
    supervisor_instructor_by_id_view

)

urlpatterns = [
    # List and create staff members
    path('', StaffMemberListCreateView.as_view(), name='staff-list'),

    # Create supervisor (branch manager functionality)
    path('create/', CreateSupervisorView.as_view(), name='create-supervisor'),


    # Update staff member by ID
    path('<int:pk>/', StaffMemberUpdateView.as_view(), name='staff-update'),
    path('<int:pk>/delete/', StaffMemberDeleteView.as_view(), name='staff-delete'),
    path('track-and-courses/<int:staff_id>/', supervisor_instructor_by_id_view, name='track_and_courses_by_id'),

]
#Hello Hossam from main