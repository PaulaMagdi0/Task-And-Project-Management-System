from django.db import models
import random
import string
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from apps.tracks.models import Track  # Adjust based on your app structure

def get_default_track():
    """Returns the first available Track instance as default (if any)."""
    from apps.tracks.models import Track  # Local import to avoid circular imports
    return Track.objects.first() if Track.objects.exists() else None

class Intake(models.Model):
    name = models.CharField(max_length=100, verbose_name='Intake Name')
    track = models.ForeignKey(
        'tracks.Track',
        related_name='intakes',
        on_delete=models.CASCADE,
        verbose_name='Track'
    )

    class Meta:
        verbose_name = 'Intake'
        verbose_name_plural = 'Intakes'
        unique_together = [['name', 'track']]
        ordering = ['track', 'name']

    def __str__(self):
        return f"{self.name} (Track: {self.track.name})"

class Student(AbstractBaseUser, PermissionsMixin):
    # Basic Information
    email = models.EmailField(verbose_name='Email Address')
    username = models.CharField(max_length=100, blank=True, default='')
    first_name = models.CharField(max_length=100, verbose_name='First Name')
    last_name = models.CharField(max_length=100, verbose_name='Last Name')
    intake = models.ForeignKey(
        Intake,
        related_name='students',
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Intake'
    )
    role = models.CharField(max_length=50, default='student', editable=False)

    # Track Relationship
    track = models.ForeignKey(
        'tracks.Track',
        related_name='students',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        default=get_default_track,
        verbose_name='Assigned Track'
    )

    # Email Verification
    verification_code = models.CharField(max_length=32, blank=True, null=True)
    verified = models.BooleanField(default=False)

    # Permissions
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    
    # Authentication Fields
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'Student'
        verbose_name_plural = 'Students'
        db_table = 'students'
        ordering = ['intake__name', 'last_name', 'first_name']
        unique_together = [['email', 'intake']]  # Ensure email is unique per intake

    def __str__(self):
        return f'{self.full_name} ({self.email}, Intake: {self.intake.name if self.intake else "None"})'

    def generate_verification_code(self):
        """Generates a random 32-character verification code."""
        if not self.verification_code:
            self.verification_code = ''.join(
                random.choices(string.ascii_letters + string.digits, k=32)
            )
            self.save()

    @property
    def full_name(self):
        """Returns the student's full name."""
        return f"{self.first_name} {self.last_name}"

    def get_short_name(self):
        """Returns the student's first name."""
        return self.first_name