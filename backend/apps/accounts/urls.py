from django.urls import path
from .views import UserListCreateView  # ✅ Make sure the name matches the class in views.py

urlpatterns = [
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
]
