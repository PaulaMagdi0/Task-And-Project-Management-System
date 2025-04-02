from django.db import models
from django.conf import settings  # Import settings to use AUTH_USER_MODEL
from apps.courses.models import Course
from apps.assignments.models import Assignment  # Ensure correct import

class AssignmentSubmission(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions")
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    
    # Fields for the file submission
    file = models.FileField(upload_to='submissions/', null=True, blank=True)
    file_url = models.URLField(null=True, blank=True)  # URL for external file (e.g., Google Drive link)
    
    # Date when the submission was made
    submission_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submission_date']  # Newest submissions first
    
    def __str__(self):
        return f"Submission by {self.student.username} for {self.assignment.title}"
