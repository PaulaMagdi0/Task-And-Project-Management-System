from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import redirect
from django.views import View
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatHomeView(View):
    """
    Redirects to the chat rooms list view.
    """
    def get(self, request):
        return redirect("chat_rooms")


class ChatRoomListCreateView(generics.ListCreateAPIView):
    """
    API view to list all chat rooms and create a new chat room.
    Both students and instructors can start a chat.
    """
    queryset = ChatRoom.objects.all().order_by("-created_at")
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """
        Allows both students and instructors to create a chat room,
        ensuring one chat per student-instructor pair.
        """
        user = self.request.user
        other_user_id = self.request.data.get("other_user_id")  # Expecting the recipient's ID

        if not other_user_id:
            raise PermissionDenied("You must specify the other participant.")

        # Check if the other user exists
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            raise PermissionDenied("The specified user does not exist.")

        if user == other_user:
            raise PermissionDenied("You cannot create a chat room with yourself.")

        # Ensure the chat is between a student and an instructor
        if user.is_student == other_user.is_student:
            raise PermissionDenied("Chats can only be between students and instructors.")

        # Assign student and instructor roles correctly
        student, instructor = (user, other_user) if user.is_student else (other_user, user)

        # Create or get the chat room
        chat_room, created = ChatRoom.objects.get_or_create(student=student, instructor=instructor)

        serializer.save(student=student, instructor=instructor)


class MyChatRoomsView(generics.ListAPIView):
    """
    API view to list chat rooms for the authenticated user.
    """
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Returns chat rooms where the authenticated user is a participant.
        """
        user = self.request.user
        return ChatRoom.objects.filter(student=user) | ChatRoom.objects.filter(instructor=user)


class MessageListCreateView(generics.ListCreateAPIView):
    """
    API view to list all messages in a chat room and send new messages.
    Requires authentication.
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Returns messages for a specific chat room, ordered by timestamp.
        """
        room_id = self.kwargs.get("room_id")  # Dynamic URL-based room_id

        if not room_id:
            raise PermissionDenied("Invalid request. A room_id is required.")

        try:
            chat_room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            raise PermissionDenied("Chat room does not exist.")

        # Ensure the user is part of the chat room
        if self.request.user not in [chat_room.student, chat_room.instructor]:
            raise PermissionDenied("You do not have permission to view this chat room.")

        return Message.objects.filter(room=chat_room).select_related("room", "sender").order_by("timestamp")

    def perform_create(self, serializer):
        """
        Ensures only participants can send messages in the chat room.
        """
        room_id = self.kwargs.get("room_id")

        try:
            chat_room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            raise PermissionDenied("Chat room does not exist.")

        if self.request.user not in [chat_room.student, chat_room.instructor]:
            raise PermissionDenied("You are not a participant in this chat room.")

        serializer.save(sender=self.request.user, room=chat_room)
