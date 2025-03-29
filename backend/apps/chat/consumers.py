import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from .models import ChatRoom, Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handles WebSocket connection."""
        user = self.scope["user"]
        if user.is_anonymous:
            await self.close()  # Reject anonymous users
            return

        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # Verify if user is part of this chat room
        if not await self.user_in_room(user, self.room_name):
            await self.send_error("Access denied: You are not a member of this chat room.")
            await self.close()
            return

        # Add the user to the WebSocket group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        """Handles WebSocket disconnection."""
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        """Handles incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            sender_id = data.get("sender")
            content = data.get("content")
            room_id = data.get("room")

            if not sender_id or not content or not room_id:
                await self.send_error("Invalid message format: Missing sender, content, or room ID.")
                return

            sender, room = await self.get_user_and_room(sender_id, room_id)

            # Ensure sender is part of the chat room
            if sender != room.student and sender != room.instructor:
                await self.send_error("Permission denied: You are not part of this chat room.")
                return

            # Save message to the database
            message = await self.create_message(room, sender, content)

            # Broadcast the message to the group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": message.content,
                    "sender": sender.username,
                    "timestamp": message.timestamp.isoformat(),
                },
            )
        except (json.JSONDecodeError, ObjectDoesNotExist) as e:
            await self.send_error(str(e))

    async def chat_message(self, event):
        """Handles message broadcasting."""
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender": event["sender"],
            "timestamp": event["timestamp"],
        }))

    async def send_error(self, error_message):
        """Sends error messages to the WebSocket."""
        await self.send(text_data=json.dumps({"error": error_message}))

    @database_sync_to_async
    def get_user_and_room(self, sender_id, room_id):
        """Fetches user and room asynchronously with error handling."""
        sender = User.objects.get(id=sender_id)
        room = ChatRoom.objects.get(id=room_id)
        return sender, room

    @database_sync_to_async
    def create_message(self, room, sender, content):
        """Creates and saves a new message asynchronously."""
        return Message.objects.create(room=room, sender=sender, content=content)

    @database_sync_to_async
    def user_in_room(self, user, room_id):
        """Checks if the user is a member of the chat room."""
        return ChatRoom.objects.filter(id=room_id, student=user) or ChatRoom.objects.filter(id=room_id, instructor=user)
