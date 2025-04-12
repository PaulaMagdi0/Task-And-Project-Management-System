from django.db import models
from django.utils import timezone
from apps.courses.models import Course
from apps.assignments.models import Assignment
from apps.student.models import Student
from apps.tracks.models import Track  # Import Track to ensure students belong to a specific track

class AssignmentSubmission(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="submissions")
    track = models.ForeignKey(Track, on_delete=models.CASCADE, null=True, blank=True)
    file = models.FileField(upload_to='submissions/', null=True, blank=True)
    file_url = models.URLField(null=True, blank=True)  # URL for external file (e.g., Google Drive link)
    
    submission_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submission_date']
    
    def __str__(self):
        return f"Submission by {self.student.username} for {self.assignment.title}"
    
    def clean(self):
        """Ensure that either a file or file_url is provided, but not both."""
        if not self.file and not self.file_url:
            raise ValueError('You must provide either a file or a file URL.')

    def save(self, *args, **kwargs):
        self.clean()  # Validate before saving
        super().save(*args, **kwargs)
