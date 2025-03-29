from rest_framework import generics
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from django.shortcuts import redirect
from django.views import View

class ChatHomeView(View):
    def get(self, request):
        return redirect("chat_rooms")  # Redirect to chat rooms list

class ChatRoomListCreateView(generics.ListCreateAPIView):
    """
    API view to list all chat rooms and create a new chat room.
    """
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer

class MessageListCreateView(generics.ListCreateAPIView):
    """
    API view to list all messages and create a new message.
    """
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
