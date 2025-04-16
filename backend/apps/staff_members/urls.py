from django.urls import path
from .views import (
    StaffMemberListCreateView,
    StaffMemberUpdateView,
    CreateStaffView,
    StaffMemberDeleteView,
    supervisor_instructor_by_id_view,
    InstructorListView,
    CreateInstructorView

)

urlpatterns = [
    # List and create staff members
    path('', StaffMemberListCreateView.as_view(), name='staff-list'),

    # Create supervisor (branch manager functionality)
    # path('create/', CreateSupervisorView.as_view(), name='create-supervisor'),
    path('create/',CreateStaffView.as_view(), name='create-supervisor'),

    path('create-instructor/', CreateInstructorView.as_view(), name='create-instructor'),

    # Update staff member by ID
    path('<int:pk>/', StaffMemberUpdateView.as_view(), name='staff-update'),
    path('<int:pk>/delete/', StaffMemberDeleteView.as_view(), name='staff-delete'),
    path('track-and-courses/<int:staff_id>/', supervisor_instructor_by_id_view, name='track_and_courses_by_id'),
    path('instructors/', InstructorListView.as_view(), name='instructor-list'),
]
#Hello Hossam from main