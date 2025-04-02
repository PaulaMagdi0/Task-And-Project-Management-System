    # urls.py in your accounts (or auth) app
from django.urls import path
from .views import login_view
from .views import MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

# from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
urlpatterns = [
    path('login/', login_view, name='login'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]


