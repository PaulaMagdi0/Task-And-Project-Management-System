    # urls.py in your accounts (or auth) app
from django.urls import path
from .views import login_view
from .views import MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
urlpatterns = [
    path('login/', login_view, name='login'),
        # JWT token obtain endpoint
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # Endpoint to refresh token
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
