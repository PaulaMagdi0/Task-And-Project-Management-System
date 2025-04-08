from django.db import models
from django.utils.timezone import now
from apps.assignments.models import Assignment
from apps.student.models import Student
from apps.courses.models import Course
from django.utils import timezone

# ✅ Ensure these functions are defined before the model
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

    class Meta:
        db_table = 'grades'

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}: {self.score}"
