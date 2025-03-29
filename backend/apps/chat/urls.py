from django.urls import path
from .views import ChatHomeView, ChatRoomListCreateView, MessageListCreateView

urlpatterns = [
    path("", ChatHomeView.as_view(), name="chat_home"),
    path("rooms/", ChatRoomListCreateView.as_view(), name="chat_rooms"),
    path("messages/", MessageListCreateView.as_view(), name="messages"),
]
