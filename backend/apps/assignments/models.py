from django.db import models
from apps.courses.models import Course  # ✅ Ensure correct import

class Assignment(models.Model):
    ASSIGNMENT_TYPES = (
        ("homework", "Homework"),
        ("project", "Project"),
        ("exam", "Exam"),
    )

    title = models.CharField(max_length=255)
    due_date = models.DateTimeField()
    assignment_type = models.CharField(max_length=50, default="homework")
    course = models.ForeignKey(Course, on_delete=models.CASCADE)  # ✅ Correct ForeignKey
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    file = models.URLField(null=True, blank=True)  # Field to store the Google Drive file URL

    class Meta:
        ordering = ["-created_at"]  # Latest first
        db_table = 'Assignment'

    def __str__(self):
        return self.title
