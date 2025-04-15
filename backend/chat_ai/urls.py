from django.urls import path
from .views import chat_with_openai

urlpatterns = [
    path('chatAI/', chat_with_openai),
]
