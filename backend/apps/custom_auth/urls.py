# apps/custom_auth/urls.py

from django.urls import path
from .views import login_view, MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', login_view, name='login'),  # For custom login view
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),  # For JWT token generation using custom view
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # For refreshing JWT tokens
]
