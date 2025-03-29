from django.urls import path
from .views import ChatHomeView, ChatRoomListCreateView, MyChatRoomsView, MessageListCreateView

urlpatterns = [
    path("", ChatHomeView.as_view(), name="chat_home"),
    path("rooms/", ChatRoomListCreateView.as_view(), name="chat_rooms"),
    path("my_chats/", MyChatRoomsView.as_view(), name="my_chats"),  # List chat rooms for the authenticated user
    path("rooms/<int:room_id>/messages/", MessageListCreateView.as_view(), name="room_messages"),  # Messages for a specific chat room
]
