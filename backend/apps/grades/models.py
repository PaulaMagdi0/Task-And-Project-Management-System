from django.db import models
from django.utils.timezone import now
from apps.assignments.models import Assignment
from apps.student.models import Student
from apps.courses.models import Course
from django.utils import timezone
from apps.submission.models import AssignmentSubmission  # Import the AssignmentSubmission model
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

    # Add the track field
    track = models.ForeignKey(
        'tracks.Track',  # String reference to avoid circular import
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Track"
    )

    # Add a submission field to link with the AssignmentSubmission model
    submission = models.ForeignKey(
        AssignmentSubmission,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="Submission"
    )

    class Meta:
        db_table = 'grades'
        unique_together = ('student', 'assignment', 'submission')  # Ensures that a student can be graded only once for the same submission

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}: {self.score}"

    def clean(self):
        """Ensure that a student can only be graded if they have submitted the assignment."""
        # Check if the student has submitted the assignment
        submission = AssignmentSubmission.objects.filter(assignment=self.assignment, student=self.student).first()
        if not submission:
            raise ValidationError(f"The student {self.student.username} has not submitted the assignment {self.assignment.title} and cannot be graded.")
        
        # Automatically set the submission if it's not already set
        if not self.submission:
            self.submission = submission
        
        # Automatically set the track field if it's not already set
        if not self.track:
            self.track = self.student.track

    def save(self, *args, **kwargs):
        # Run the clean method before saving to validate the condition
        self.clean()
        
        # Save the model with updated track and submission fields
        super().save(*args, **kwargs)
