from django.db import models
from django.utils.timezone import now
from apps.assignments.models import Assignment
from apps.student.models import Student
from apps.courses.models import Course
from django.utils import timezone
from apps.submission.models import AssignmentSubmission
from django.core.exceptions import ValidationError


def get_default_assignment():
    """Return the first available Assignment ID, or None if no assignments exist."""
    first_assignment = Assignment.objects.first()
    return first_assignment.id if first_assignment else None


def get_default_student():
    return Student.objects.values_list('id', flat=True).first()


class Grade(models.Model):
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        default=get_default_assignment
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="grades",
        default=get_default_student
    )
    score = models.IntegerField()
    feedback = models.TextField()
    graded_date = models.DateTimeField(default=now)
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(default=timezone.now)
    track = models.ForeignKey(
        'tracks.Track',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Track"
    )
    submission = models.ForeignKey(
        AssignmentSubmission,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="Submission"
    )

    class Meta:
        db_table = 'grades'
        unique_together = ('student', 'assignment', 'submission')

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}: {self.score}"

    def clean(self):
        """Validation logic"""
        submission = AssignmentSubmission.objects.filter(
            assignment=self.assignment, 
            student=self.student
        ).first()
        
        if not submission:
            raise ValidationError(
                f"Student {self.student.username} hasn't submitted {self.assignment.title}"
            )
        
        if not self.submission:
            self.submission = submission
            
        if not self.track:
            self.track = self.student.track

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)