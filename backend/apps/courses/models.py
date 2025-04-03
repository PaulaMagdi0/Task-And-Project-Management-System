from django.db import models
from apps.staff_members.models import StaffMember

class Course(models.Model):
    
    name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # One track can have many courses (many courses per track)
    track = models.ForeignKey(
        'tracks.Track',  
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    # The instructor is a foreign key to StaffMember
    instructor = models.ForeignKey(
        StaffMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses"
    )

    class Meta:
        unique_together = ("name", "track")  # Ensure each course is unique per track
        ordering = ["-created_at"]  # Orders by created_at in descending order
        db_table = 'courses'  # Custom table name

    def save(self, *args, **kwargs):
        # Allowed roles for an instructor
        allowed_roles = ["instructor", "branch_manager", "supervisor"]

        if self.instructor and self.instructor.role not in allowed_roles:
            raise ValueError("Assigned user must have the role 'instructor', 'branch_manager', or 'supervisor'.")
        
        super().save(*args, **kwargs)

    def __str__(self):
        # Return course name with track and instructor information
        track_name = self.track.name if self.track else "No Track"
        instructor_name = (self.instructor.get_full_name() or self.instructor.username) if self.instructor else "No Instructor"
        return f"{self.name} ({track_name}) - Instructor: {instructor_name}"
