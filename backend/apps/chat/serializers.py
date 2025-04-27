# File: apps/chat/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from .models import ChatRoom, ChatParticipant, Message

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # include whatever user fields you need, e.g. role
        fields = ["id", "username", "email", "role"]


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "room", "sender", "text", "timestamp"]
        read_only_fields = ["timestamp", "sender", "room"]


class ChatRoomSerializer(serializers.ModelSerializer):
    participants   = serializers.SerializerMethodField()
    last_message   = serializers.SerializerMethodField()
    unread_count   = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            "id",
            "name",
            "created_at",
            "participants",
            "last_message",
            "unread_count",
        ]
        read_only_fields = ["created_at", "name"]

    def get_participants(self, room):
        parts = ChatParticipant.objects.filter(room=room)
        users = []
        for part in parts:
            try:
                user = User.objects.get(pk=part.object_id)
            except User.DoesNotExist:
                continue
            users.append(UserSerializer(user).data)
        return users

    def get_last_message(self, room):
        msg = (
            Message.objects.filter(room=room)
                           .order_by("-timestamp")
                           .first()
        )
        return MessageSerializer(msg).data if msg else None

    def get_unread_count(self, room):
        request = self.context.get("request", None)
        if not (request and request.user.is_authenticated):
            return 0

        user = request.user
        ct = ContentType.objects.get_for_model(user)
        try:
            part = ChatParticipant.objects.get(
                room=room, content_type=ct, object_id=user.id
            )
            last_read = part.last_read or timezone.make_aware(timezone.datetime.min)
        except ChatParticipant.DoesNotExist:
            last_read = timezone.make_aware(timezone.datetime.min)

        # count only messages newer than last_read AND NOT sent by this user
        return Message.objects.filter(
            room=room,
            timestamp__gt=last_read
        ).exclude(
            sender_object_id=user.id
        ).count()
