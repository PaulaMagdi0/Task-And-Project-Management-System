# File: apps/chat/urls.py
from django.urls import path
from .views import (
    ChatRoomListCreateView, MyChatRoomsView,
    MessageListCreateView, SearchUsersView
)

app_name = 'chat'
urlpatterns = [
    path('rooms/', ChatRoomListCreateView.as_view(), name='chat_rooms'),
    path('rooms/my/', MyChatRoomsView.as_view(), name='my_chat_rooms'),
    path('rooms/<int:room_id>/messages/', MessageListCreateView.as_view(), name='chat_room_messages'),
    path('users/', SearchUsersView.as_view(), name='search_users'),
]
