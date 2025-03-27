from django.db import models
from apps.tracks.models import Track
from apps.accounts.models import CustomUser  # ✅ Import CustomUser

class Course(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    track = models.ForeignKey(
        Track, 
        on_delete=models.CASCADE, 
        null=True, blank=True  # ✅ Avoid using a static default
    )

    instructor = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True, blank=True,  # ✅ Allow courses without an instructor
        related_name="courses"
    )

    class Meta:
        unique_together = ("name", "track")  # ✅ Prevent duplicate course names in the same track
        ordering = ["-created_at"]  # ✅ Order courses by creation date

    def save(self, *args, **kwargs):
        # ✅ Ensure instructor has the correct role before saving
        if self.instructor and self.instructor.role != "instructor":
            raise ValueError("Assigned user must have the role 'instructor'.")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.track.name if self.track else 'No Track'}) - Instructor: {self.instructor.full_name if self.instructor else 'No Instructor'}"
