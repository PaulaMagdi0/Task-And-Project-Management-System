# apps/custom_auth/urls.py

from django.urls import path
from .views import login_view, MyTokenObtainPairView,logout_view
from .views import MyTokenRefreshView

urlpatterns = [
    path('login/', login_view, name='api_login'),
    path('logout/', logout_view, name='api_logout'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', MyTokenRefreshView.as_view(), name='token_refresh'),
]
