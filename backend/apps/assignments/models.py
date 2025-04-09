# In apps/assignments/models.py
from django.db import models
from django.utils import timezone
from apps.courses.models import Course, Track  # Assuming Track is in courses
from apps.student.models import Student

# Through model to hold the additional `course` field in the relationship
class AssignmentStudent(models.Model):
    assignment = models.ForeignKey('Assignment', on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('assignment', 'student')

    def __str__(self):
        return f"{self.student.full_name} - {self.assignment.title} ({self.course.name})"


class Assignment(models.Model):
    ASSIGNMENT_TYPES = (
        ("task", "Task"),
        ("project", "Project"),
        ("exam", "Exam"),
    )

    title = models.CharField(max_length=255)
    due_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(default=None)
    assignment_type = models.CharField(
        max_length=50, choices=ASSIGNMENT_TYPES, default="homework"
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    file = models.URLField(null=True, blank=True)
    file_url = models.URLField(null=True, blank=True)

    # Use the `through` model to link students to assignments with a course field
    assigned_to = models.ManyToManyField(
        Student, through='AssignmentStudent', related_name='assignments', blank=True
    )

    class Meta:
        ordering = ["-created_at"]
        db_table = "assignments"

    def __str__(self):
        assigned_display = self.get_assigned_to_display()
        return f"{self.title} ({self.get_assignment_type_display()} - {assigned_display})"

    def get_assigned_to_display(self):
        if self.assigned_to.exists():
            assigned_students = [
                f"{student.full_name} ({student.assignmentstudent_set.first().course.name})"
                for student in self.assigned_to.all()
            ]
            return f"Assigned to {', '.join(assigned_students)}"
        return "Assigned to All"

    def save(self, *args, **kwargs):
        if not self.end_date:
            self.end_date = self.get_default_end_date()

        if self.end_date and self.due_date and self.end_date < self.due_date:
            raise ValueError("End date must be after the due date.")
        
        super().save(*args, **kwargs)

    def get_default_end_date(self):
        return timezone.make_aware(
            timezone.datetime.combine(timezone.now().date(), timezone.datetime.min.time()) + timezone.timedelta(days=1)
        )
