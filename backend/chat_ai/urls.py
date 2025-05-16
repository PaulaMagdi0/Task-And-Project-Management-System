from django.urls import path
from .views import chat_with_hf

urlpatterns = [
    path('chatAI/', chat_with_hf, name='chat_with_hf'),
]
