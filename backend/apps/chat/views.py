# File: apps/chat/views.py
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import ChatRoom, ChatParticipant, Message
from .serializers import ChatRoomSerializer, MessageSerializer, UserSerializer

User = get_user_model()

class ChatRoomListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        ct = ContentType.objects.get_for_model(user)
        room_ids = ChatParticipant.objects.filter(
            content_type=ct, object_id=user.id
        ).values_list('room_id', flat=True)
        return ChatRoom.objects.filter(id__in=room_ids).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        user = request.user
        other_id = request.data.get('other_user_id')
        if not other_id:
            raise PermissionDenied("You must specify other_user_id.")
        other = get_object_or_404(User, pk=other_id)
        if user == other:
            raise PermissionDenied("Cannot chat with yourself.")

        user_ct  = ContentType.objects.get_for_model(user)
        other_ct = ContentType.objects.get_for_model(other)

        # existing 1:1?
        room_ids = ChatParticipant.objects.filter(
            content_type=user_ct, object_id=user.id
        ).values_list('room_id', flat=True)
        shared = ChatParticipant.objects.filter(
            room_id__in=room_ids,
            content_type=other_ct, object_id=other.id
        ).values_list('room_id', flat=True)

        if shared:
            room = ChatRoom.objects.get(pk=shared[0])
            return Response(self.get_serializer(room).data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        # build a deterministic, unique name for this 1:1
        user = self.request.user
        other = get_object_or_404(User, pk=self.request.data['other_user_id'])
        names = sorted([user.username, other.username])
        room_name = f"chat_{names[0]}_{names[1]}"
        room = serializer.save(name=room_name)

        user_ct  = ContentType.objects.get_for_model(user)
        other_ct = ContentType.objects.get_for_model(other)
        ChatParticipant.objects.bulk_create([
            ChatParticipant(room=room, content_type=user_ct,  object_id=user.id),
            ChatParticipant(room=room, content_type=other_ct, object_id=other.id),
        ])


class MyChatRoomsView(generics.ListAPIView):
    serializer_class   = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        ct   = ContentType.objects.get_for_model(user)
        room_ids = ChatParticipant.objects.filter(
            content_type=ct, object_id=user.id
        ).values_list("room_id", flat=True)
        return ChatRoom.objects.filter(id__in=room_ids).order_by("-created_at")

    def get_serializer_context(self):
        # include request so our serializer can fetch `request.user`
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_room(self):
        return get_object_or_404(ChatRoom, pk=self.kwargs['room_id'])

    def check_participation(self, room, user):
        ct = ContentType.objects.get_for_model(user)
        return ChatParticipant.objects.filter(
            room=room, content_type=ct, object_id=user.id
        ).exists()

    def get_queryset(self):
        room = self.get_room()
        user = self.request.user

        if not self.check_participation(room, user):
            raise PermissionDenied("Not a participant in this room.")

        # mark messages as “read” up to now
        user_ct = ContentType.objects.get_for_model(user)
        ChatParticipant.objects.filter(
            room=room,
            content_type=user_ct,
            object_id=user.id
        ).update(last_read=timezone.now())

        return Message.objects.filter(room=room).order_by('timestamp')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['room']   = self.get_room()
        ctx['sender'] = self.request.user
        return ctx

    def perform_create(self, serializer):
        room = self.get_room()
        user = self.request.user

        if not self.check_participation(room, user):
            raise PermissionDenied("Not a participant in this room.")

        ct = ContentType.objects.get_for_model(user)
        serializer.save(
            room=room,
            sender_content_type=ct,
            sender_object_id=user.id
        )


class SearchUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        q = self.request.query_params.get('q', '').strip()
        if not q:
            return User.objects.none()
        return User.objects.filter(
            Q(username__icontains=q) | Q(email__icontains=q)
        )[:20]
