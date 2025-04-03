from django.db import models
from django.utils import timezone
from apps.courses.models import Course  # ✅ Ensure correct import

class Assignment(models.Model):
    ASSIGNMENT_TYPES = (
        ("task", "Task"),
        ("project", "Project"),
        ("exam", "Exam"),
    )

    title = models.CharField(max_length=255)
    due_date = models.DateTimeField(default=timezone.now)  # Default is current time (when announced)
    end_date = models.DateTimeField(default=None)  # Temporarily set default as None
    assignment_type = models.CharField(
        max_length=50, choices=ASSIGNMENT_TYPES, default="homework"
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    file = models.URLField(null=True, blank=True)  # This is the file URL field
    file_url = models.URLField(null=True, blank=True)  # Add this if needed as a separate field

    class Meta:
        ordering = ["-created_at"]  # Latest first
        db_table = "assignments" 

    def __str__(self):
        return f"{self.title} ({self.get_assignment_type_display()})"
    
    def save(self, *args, **kwargs):
        # If end_date is None, set it to the end of the current day
        if not self.end_date:
            self.end_date = self.get_default_end_date()

        # Ensure that the end_date is after the due_date
        if self.end_date and self.due_date and self.end_date < self.due_date:
            raise ValueError("End date must be after the due date.")
        
        super().save(*args, **kwargs)

    def get_default_end_date(self):
        """Compute the default end date to be the end of the current day."""
        # Ensure the date is timezone-aware
        return timezone.make_aware(
            timezone.datetime.combine(timezone.now().date(), timezone.datetime.min.time()) + timezone.timedelta(days=1)
        )
