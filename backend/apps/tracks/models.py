from django.db import models
from apps.staff_members.models import StaffMember
from apps.branch_location.models import Branch
from django.utils import timezone

class Track(models.Model):
    TRACK_TYPE_CHOICES = [
        ('ICC', 'ICC'),
        ('9month', '9 Month'),
    ]
    
    name = models.CharField(max_length=255)
    courses = models.ManyToManyField(
        "courses.Course", 
        related_name="tracks_set",
        blank=True,
        through="courses.CourseTrack"
    )
    description = models.TextField()
    track_type = models.CharField(
        max_length=10,
        choices=TRACK_TYPE_CHOICES,
        default='ICC',
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
        on_delete=models.CASCADE,
        related_name="tracks",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

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