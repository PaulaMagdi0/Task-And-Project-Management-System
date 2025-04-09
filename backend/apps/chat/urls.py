from django.urls import path, re_path
from .consumers import ChatConsumer
from .views import ChatHomeView, ChatRoomListCreateView, MyChatRoomsView, MessageListCreateView

urlpatterns = [
    path("", ChatHomeView.as_view(), name="chat_home"),
    path("rooms/", ChatRoomListCreateView.as_view(), name="chat_rooms"),
    path("my_chats/", MyChatRoomsView.as_view(), name="my_chats"),
    path("rooms/<int:room_id>/messages/", MessageListCreateView.as_view(), name="room_messages"),
]

# WebSocket URL patterns (note the use of room_id for consistency)
websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<room_id>\w+)/$", ChatConsumer.as_asgi()),
]
