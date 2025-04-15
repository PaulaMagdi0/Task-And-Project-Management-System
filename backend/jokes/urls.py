from django.urls import path
from .views import JokeAPIView

urlpatterns = [
    path('joke/', JokeAPIView.as_view(), name='joke-api'),
]
