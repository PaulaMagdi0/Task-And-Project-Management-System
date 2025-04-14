from django.db import models
from apps.staff_members.models import StaffMember
from apps.branch_location.models import Branch  # Import Branch model
from django.utils import timezone

class Track(models.Model):
    TRACK_TYPE_CHOICES = [
        ('ICC', 'ICC'),
        ('9month', '9 Month'),
        # Add more track types as needed
    ]
    
    name = models.CharField(max_length=255)
    courses = models.ManyToManyField(
        "courses.Course", 
        related_name="tracks_set",  # Renamed related_name to avoid clashes
        blank=True,
        through="courses.CourseTrack"  # Corrected to reference the model path explicitly
    )
    description = models.TextField()
    track_type = models.CharField(
        max_length=10,
        choices=TRACK_TYPE_CHOICES,
        default='ICC',  # Set a default track type
    )
    created_at = models.DateTimeField(default=timezone.now)
    supervisor = models.ForeignKey(
        StaffMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supervised_tracks"
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,  # If the branch is deleted, the track will also be deleted
        related_name="tracks",  # Allows access to tracks from the Branch instance
        null=True,
        blank=True,
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
        return f"{self.name} ({full_name}) - Branch: {self.branch.name if self.branch else 'No Branch'}"
