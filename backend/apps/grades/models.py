from django.db import models
from django.utils.timezone import now
from apps.assignments.models import Assignment
from apps.student.models import Student
from apps.courses.models import Course
from django.utils import timezone
from apps.submission.models import AssignmentSubmission
from django.core.exceptions import ValidationError
import logging

# Define the logger
logger = logging.getLogger(__name__)



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
        """Validation logic to ensure a matching submission exists."""
        # Check if course or track is None
        if not self.course:
            logger.debug(f"Course is None for Student ID: {self.student.id}, Assignment ID: {self.assignment.id}")
        if not self.track:
            logger.debug(f"Track is None for Student ID: {self.student.id}, Assignment ID: {self.assignment.id}")
        
        # Proceed only if course and track are not None
        if self.course and self.track:
            logger.debug(f"Checking submission for Student ID: {self.student.id}, Assignment ID: {self.assignment.id}, Course ID: {self.course.id}, Track ID: {self.track.id}")

            submission = AssignmentSubmission.objects.filter(
                assignment=self.assignment,
                student=self.student,
                course=self.course,
                track=self.track,
            ).first()

            if submission:
                logger.debug(f"Found submission: ID {submission.id}, Course ID: {submission.course.id}, Track ID: {submission.track.id}")
            else:
                logger.debug(f"No submission found for Student ID: {self.student.id}, Assignment ID: {self.assignment.id}, Course ID: {self.course.id}, Track ID: {self.track.id}")

            if not submission:
                raise ValidationError(
                    f"Student '{self.student.username}' has not submitted '{self.assignment.title}' for the specified course and track."
                )

            # Auto-set submission if not explicitly provided
            if not self.submission:
                self.submission = submission

            # Auto-set track if not explicitly provided
            if not self.track:
                self.track = submission.track or self.student.track
        else:
            raise ValidationError("Course or Track is missing.")

    def save(self, *args, **kwargs):
        # Ensure course and track are set before saving
        if not self.course:
            if self.submission:
                self.course = self.submission.course
            else:
                raise ValidationError("Course is missing.")

        if not self.track:
            if self.submission:
                self.track = self.submission.track
            else:
                raise ValidationError("Track is missing.")
        
        self.clean()  # Validate before saving
        super().save(*args, **kwargs)

