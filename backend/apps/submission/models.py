from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.courses.models import Course
from apps.assignments.models import Assignment
from apps.student.models import Student, Intake
from apps.tracks.models import Track

class AssignmentSubmission(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="submissions")
    intake = models.ForeignKey(Intake, on_delete=models.SET_NULL, null=True, related_name="submissions")
    track = models.ForeignKey(Track, on_delete=models.SET_NULL, null=True, blank=True)
    file = models.FileField(upload_to='submissions/', null=True, blank=True)
    file_url = models.URLField(null=True, blank=True)
    submitted = models.BooleanField(default=False)
    submission_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submission_date']
        unique_together = [['assignment', 'student', 'intake']]

    def __str__(self):
        return f"Submission by {self.student.username} for {self.assignment.title}"

    def clean(self):
        if not self.file and not self.file_url:
            raise ValidationError('You must provide either a file or a file URL.')
        if self.student and self.intake and self.student.intake != self.intake:
            raise ValidationError('Submission intake must match the студент intake.')

    def save(self, *args, **kwargs):
        if not self.intake and self.student:
            self.intake = self.student.intake
        self.clean()
        super().save(*args, **kwargs)