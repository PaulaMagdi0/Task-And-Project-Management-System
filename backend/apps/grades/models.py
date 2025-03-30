from django.db import models
from django.utils.timezone import now
from apps.assignments.models import Assignment
from apps.student.models import Student  # Updated import: use the Student model now
from apps.courses.models import Course  # Ensure course is linked properly

# Default function to get the first available assignment
def get_default_assignment():
    return Assignment.objects.first().id if Assignment.objects.exists() else None

# Default function to get the first available student from the Student model
def get_default_student():
    return Student.objects.first().id if Student.objects.exists() else None

class Grade(models.Model):
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        default=get_default_assignment  # Dynamic default
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        # No need for limit_choices_to since only Student model is used for students
        related_name="grades",
        default=get_default_student  # Dynamic default
    )
    score = models.IntegerField()
    feedback = models.TextField()
    graded_date = models.DateTimeField(default=now)  # Default timestamp
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}: {self.score}"
