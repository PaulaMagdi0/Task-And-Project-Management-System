from django.db import models
from django.utils import timezone
from apps.staff_members.models import StaffMember
from apps.branch_location.models import Branch
from apps.tracks.models import Track
from apps.student.models import Intake
from django.core.exceptions import ValidationError

class Course(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    tracks = models.ManyToManyField(
        Track,
        related_name="course_tracks",
        through="CourseTrack",
    )
    instructor = models.ForeignKey(
        StaffMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses"
    )
    intake = models.ForeignKey(
        Intake,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses",
        verbose_name="Intake"
    )

    class Meta:
        db_table = 'courses'

    def clean(self):
        super().clean()
        if self.intake and self.tracks.exists():
            # Check if the selected intake belongs to one of the course's tracks
            track_ids = self.tracks.values_list('id', flat=True)
            if not Intake.objects.filter(id=self.intake.id, track__id__in=track_ids).exists():
                raise ValidationError("Selected intake must belong to one of the course's tracks.")

    def __str__(self):
        return self.name

class CourseTrack(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'courses_tracks'