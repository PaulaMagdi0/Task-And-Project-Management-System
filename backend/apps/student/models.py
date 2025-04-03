# students/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
import random
import string

def get_default_track():
    """Returns the first available Track instance as default (if any)."""
    from apps.tracks.models import Track  # Local import to avoid circular imports
    return Track.objects.first() if Track.objects.exists() else None

class Student(AbstractBaseUser, PermissionsMixin):
    # Basic Information
    email = models.EmailField(unique=True, verbose_name='Email Address')
    username = models.CharField(max_length=100, blank=True, default='')
    first_name = models.CharField(max_length=100, verbose_name='First Name')
    last_name = models.CharField(max_length=100, verbose_name='Last Name')
    role = models.CharField(max_length=50, default='student', editable=False)

    # Track Relationship (using string reference)
    track = models.ForeignKey(
        'tracks.Track',  # String reference to avoid direct import
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

    # Authentication Fields
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'Student'
        verbose_name_plural = 'Students'
        db_table = 'students'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f'{self.full_name} ({self.email})'

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