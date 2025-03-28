from django.urls import path
from .views import ProtectedView, RegisterView, UserListView  # ✅ Ensure correct import

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("protected/", ProtectedView.as_view(), name="protected"),
    path("users/", UserListView.as_view(), name="user-list"),  # ✅ Correct endpoint
]
