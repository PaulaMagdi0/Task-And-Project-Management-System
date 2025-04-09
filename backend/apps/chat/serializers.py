from rest_framework import serializers
from .models import ChatRoom, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'image']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'timestamp']

class ChatRoomSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'participants', 'last_message', 'other_user']

    def get_participants(self, obj):
        # Define participants as student and instructor
        return UserSerializer([obj.student, obj.instructor], many=True).data

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        return MessageSerializer(last_msg).data if last_msg else None

    def get_other_user(self, obj):
        user = self.context['request'].user
        return UserSerializer([obj.student, obj.instructor].exclude(id=user.id).first()).data
