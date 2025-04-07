from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()

class ChatRoom(models.Model):
    """
    Model representing a chat room between a student and an instructor.
    Ensures only one chat room exists per student-instructor pair.
    """
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="student_rooms")
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="instructor_rooms")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "instructor")  # Prevents duplicate chat rooms

    def __str__(self):
        return f"Chat between {self.student} and {self.instructor}"

    def clean(self):
        """
        Validates that a chat room exists only once per student-instructor pair.
        Prevents duplicate rooms at the model level.
        """
        if ChatRoom.objects.filter(
            student=self.student, instructor=self.instructor
        ).exclude(id=self.id).exists():
            raise ValidationError("A chat room between this student and instructor already exists.")

    @property
    def last_message(self):
        """
        Returns the most recent message's content and timestamp, if available.
        Optimized for efficiency using `.values()`.
        """
        return self.messages.order_by("-timestamp").values("content", "timestamp").first()


class Message(models.Model):
    """
    Model representing messages exchanged in a chat room.
    """
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]  # Ensures messages are retrieved in chronological order

    def __str__(self):
        return f"Message from {self.sender} in room {self.room.id}"

    def clean(self):
        """
        Ensures that the sender is a valid participant of the chat room.
        """
        if self.sender not in [self.room.student, self.room.instructor]:
            raise ValidationError("You are not a participant in this chat room.")
