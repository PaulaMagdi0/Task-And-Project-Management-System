from rest_framework import serializers
from .models import ChatRoom, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()  # Returns sender's details
    room = serializers.PrimaryKeyRelatedField(queryset=ChatRoom.objects.all())  # Ensures valid room

    class Meta:
        model = Message
        fields = ["id", "room", "sender", "content", "timestamp"]  # Essential fields only
        read_only_fields = ["id", "sender", "timestamp"]  # Prevents manual input

    def get_sender(self, obj):
        """Returns sender's username and ID."""
        return {"id": obj.sender.id, "username": obj.sender.username}


class ChatRoomSerializer(serializers.ModelSerializer):
    messages = serializers.SerializerMethodField()  # Orders messages by timestamp
    student = serializers.StringRelatedField()  # Shows student username
    instructor = serializers.StringRelatedField()  # Shows instructor username

    class Meta:
        model = ChatRoom
        fields = ["id", "student", "instructor", "created_at", "messages"]
        read_only_fields = ["id", "created_at"]

    def get_messages(self, obj):
        """Returns messages ordered by timestamp."""
        return MessageSerializer(obj.messages.order_by("timestamp"), many=True).data
