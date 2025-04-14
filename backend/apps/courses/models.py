from django.db import models
from apps.staff_members.models import StaffMember
from apps.branch_location.models import Branch  # Import Branch model
from django.utils import timezone
from apps.tracks.models import Track

class Course(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)  # Set default to now
    
    # Many-to-many relationship through the `courses_tracks` table
    tracks = models.ManyToManyField(
        Track,
        related_name="course_tracks",  # Change related_name here
        through="CourseTrack",  # Custom intermediary model
    )

    # Instructor relationship
    instructor = models.ForeignKey(
        StaffMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses"
    )
    class Meta:
        db_table = 'courses'  # Define the intermediary table name
    def __str__(self):
        return self.name  # This ensures that the course name is shown in the admin panel
    
class CourseTrack(models.Model):
    # This is the intermediary table
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)  # Set default to now
    class Meta:
        db_table = 'courses_tracks'  # Define the intermediary table name
