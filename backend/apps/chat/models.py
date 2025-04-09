from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()

class ChatRoom(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="student_rooms")
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="instructor_rooms")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "instructor")

    def __str__(self):
        return f"Chat between {self.student} and {self.instructor}"

    def clean(self):
        if ChatRoom.objects.filter(student=self.student, instructor=self.instructor).exclude(id=self.id).exists():
            raise ValidationError("A chat room between this student and instructor already exists.")

    @property
    def last_message(self):
        return self.messages.order_by("-timestamp").values("content", "timestamp").first()

class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"Message from {self.sender} in room {self.room.id}"

    def clean(self):
        if self.sender not in [self.room.student, self.room.instructor]:
            raise ValidationError("You are not a participant in this chat room.")
