# core/urls.py
from django.urls import path
from .views import chat  # Import the chat view

urlpatterns = [
    path('api/chat/', chat, name='chat'),
    ]