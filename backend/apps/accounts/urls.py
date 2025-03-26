from django.urls import path
from .views import UserListView

urlpatterns = [
    path("users/", UserListView.as_view(), name="user-list"),
]
