from django.db import models
from apps.staff_members.models import StaffMember
from django.utils import timezone

class Track(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    supervisor = models.ForeignKey(
        StaffMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supervised_tracks"
    )

    courses = models.ManyToManyField(
        'courses.Course',  # String-based reference for Course model
        related_name='course_tracks', 
        blank=True
    )

    class Meta:
        ordering = ["-created_at"]
        db_table = 'tracks'

    def save(self, *args, **kwargs):
        if self.supervisor and self.supervisor.role != "supervisor":
            raise ValueError("Assigned user must have the role 'supervisor'.")
        super().save(*args, **kwargs)

    def __str__(self):
        full_name = self.supervisor.get_full_name() if self.supervisor else "No Supervisor"
        return f"{self.name} ({full_name})"
