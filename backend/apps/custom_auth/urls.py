# apps/custom_auth/urls.py
from django.urls import path
from .views import (
    login_view,
    logout_view,
    PasswordResetRequestView,
    PasswordResetVerifyView,
    PasswordResetConfirmView,
    MyTokenObtainPairView,
    MyTokenRefreshView,
)

urlpatterns = [
    path('login/', login_view, name='api_login'),
    path('logout/', logout_view, name='api_logout'),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-verify/', PasswordResetVerifyView.as_view(), name='password_reset_verify'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', MyTokenRefreshView.as_view(), name='token_refresh'),
]