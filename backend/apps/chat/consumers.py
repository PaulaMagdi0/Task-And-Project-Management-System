import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from .models import ChatRoom, Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            token = self.scope["query_string"].decode().split("=")[1]
            access_token = AccessToken(token)
            self.user = await self.get_user(access_token.payload['user_id'])
            self.room_id = self.scope['url_route']['kwargs']['room_id']
            self.room_group_name = f'chat_{self.room_id}'

            if not await self.validate_room():
                await self.close()
                return

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()
        except Exception as e:
            await self.close()

    @database_sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)

    @database_sync_to_async
    def validate_room(self):
        return ChatRoom.objects.filter(id=self.room_id, participants=self.user).exists()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['content']
        sender = self.user
        message_obj = await self.save_message(message, sender)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': sender.id,
                'sender_username': sender.username,
                'timestamp': message_obj.timestamp.isoformat(),
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_username': event['sender_username'],
            'timestamp': event['timestamp']
        }))

    @database_sync_to_async
    def save_message(self, content, sender):
        room = ChatRoom.objects.get(id=self.room_id)
        return Message.objects.create(room=room, sender=sender, content=content)
