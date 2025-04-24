from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class ChatRoom(models.Model):
    """
    Represents a conversation between two or more users.
    Participants may be of different user models (Student, StaffMember, etc.).
    """
    name = models.CharField(
        max_length=255,
        unique=True,
        help_text="Unique identifier for the chat room (e.g., 'student1_staff2')"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the chat room was created."
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Chat Room'
        verbose_name_plural = 'Chat Rooms'

    def __str__(self):
        return self.name
    class Meta:
         ordering = ['-created_at']
         verbose_name = 'Chat Room'
         verbose_name_plural = 'Chat Rooms'

    def __str__(self):
         return self.name


class ChatParticipant(models.Model):
    """
    Links a ChatRoom to any user instance via a GenericForeignKey.
    Ensures a participant is only added once per room.
    """
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='participants',
        help_text='The chat room this participant belongs to.'
    )
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        help_text='Content type of the user model.'
    )
    object_id = models.PositiveIntegerField(
        help_text='Primary key of the user.'
    )
    user = GenericForeignKey('content_type', 'object_id')
    last_read = models.DateTimeField(null=True, blank=True)
    class Meta:
        unique_together = ('room', 'content_type', 'object_id')
        verbose_name = 'Chat Participant'
        verbose_name_plural = 'Chat Participants'

    def __str__(self):
        return f"{self.user} in {self.room.name}"


class Message(models.Model):
    """
    Stores a single message in a chat room.
    Sender may be any user model instance.
    """
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='messages',
        help_text='The chat room this message is part of.'
    )
    sender_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        help_text='Content type of the sender model.'
    )
    sender_object_id = models.PositiveIntegerField(
        help_text='Primary key of the sender.'
    )
    sender = GenericForeignKey('sender_content_type', 'sender_object_id')

    text = models.TextField(
        help_text='Message text content.'
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text='Timestamp when the message was sent.'
    )

    class Meta:
        ordering = ['timestamp']
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        indexes = [
            models.Index(fields=['room', 'timestamp']),
        ]

    def __str__(self):
        short = (self.text[:20] + '...') if len(self.text) > 23 else self.text
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {self.sender}: {short}"
