from django.db import models
from django.conf import settings
from apps.courses.models import Course
from apps.assignments.models import Assignment

class AssignmentSubmission(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions")
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    
    file = models.FileField(upload_to='submissions/', null=True, blank=True)
    file_url = models.URLField(null=True, blank=True)  # URL for external file (e.g., Google Drive link)
    
    submission_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submission_date']
    
    def __str__(self):
        return f"Submission by {self.student.username} for {self.assignment.title}"
