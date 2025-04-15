from django.db import models
from django.utils import timezone
from apps.student.models import Student
from apps.courses.models import Course
from apps.tracks.models import Track

# Through model to hold the additional `course` and `track` fields in the relationship
class AssignmentStudent(models.Model):
    assignment = models.ForeignKey('Assignment', on_delete=models.CASCADE)
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE)
    student = models.ForeignKey('student.Student', on_delete=models.CASCADE, null=True, blank=True)
    track = models.ForeignKey('tracks.Track', null=True, blank=True, on_delete=models.SET_NULL)

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
        max_length=50, choices=ASSIGNMENT_TYPES, default="task"
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    file = models.URLField(null=True, blank=True)
    file_url = models.URLField(null=True, blank=True)

    # Add a ForeignKey to Track to link each assignment with a track
    track = models.ForeignKey('tracks.Track', on_delete=models.SET_NULL, null=True, blank=True)

    # Use the `through` model to link students to assignments with a course and track field
    assigned_to = models.ManyToManyField(
        Student, through='AssignmentStudent', related_name='assignments', blank=True
    )

    class Meta:
        ordering = ["-created_at"]
        db_table = "assignments"

    def __str__(self):
        assigned_display = ""
        for assignment_student in self.assignmentstudent_set.all():
            student = assignment_student.student
            course = assignment_student.course
            assigned_display += f"{student.full_name} ({course.name}), "
        return assigned_display[:-2]  # Remove trailing comma and space

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
