from django.db import models
from apps.staff_members.models import StaffMember

class Course(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # Use string-based reference for Track model to avoid circular import
    track = models.ForeignKey(
        'tracks.Track',  # String-based reference
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    # Foreign key to StaffMember (Instructor)
    instructor = models.ForeignKey(
        StaffMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses"
    )

    tracks = models.ManyToManyField(
        'tracks.Track',  # String-based reference for Track model
        related_name='course_tracks', 
        blank=True
    )

    class Meta:
        unique_together = ("name", "track")
        ordering = ["-created_at"]
        db_table = 'courses'

    def save(self, *args, **kwargs):
        if self.instructor and self.instructor.role != "instructor":
            raise ValueError("Assigned user must have the role 'instructor'.")
        super().save(*args, **kwargs)

    def __str__(self):
        track_name = self.track.name if self.track else "No Track"
        instructor_name = (self.instructor.get_full_name() or self.instructor.username) if self.instructor else "No Instructor"
        return f"{self.name} ({track_name}) - Instructor: {instructor_name}"
