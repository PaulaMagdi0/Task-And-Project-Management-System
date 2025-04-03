from django.db import models
from apps.staff_members.models import StaffMember

class Course(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    track = models.ForeignKey(
        'tracks.Track',  
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    instructor = models.ForeignKey(
        StaffMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses"
    )

    tracks = models.ManyToManyField(
        'tracks.Track',  
        related_name='course_tracks', 
        blank=True
    )

    class Meta:
        unique_together = ("name", "track")
        ordering = ["-created_at"]
        db_table = 'courses'

    def save(self, *args, **kwargs):
        # Allowed roles for an instructor
        allowed_roles = ["instructor", "branch_manager", "supervisor"]

        if self.instructor and self.instructor.role not in allowed_roles:
            raise ValueError("Assigned user must have the role 'instructor', 'branch_manager', or 'supervisor'.")
        
        super().save(*args, **kwargs)

    def __str__(self):
        track_name = self.track.name if self.track else "No Track"
        instructor_name = (self.instructor.get_full_name() or self.instructor.username) if self.instructor else "No Instructor"
        return f"{self.name} ({track_name}) - Instructor: {instructor_name}" 
