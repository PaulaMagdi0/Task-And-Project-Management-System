from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from apps.tracks.models import Track
import random
import string

def get_default_track():
    """Returns the first available Track instance as default (if any)."""
    from apps.tracks.models import Track  # Import here to avoid circular imports
    return Track.objects.order_by('id').first() if Track.objects.exists() else None  # Ensure there's at least one Track

class Student(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=100, blank=True, default='')  
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=50, default='student')

    # ForeignKey reference to Track (from a different app)
    track = models.ForeignKey(
        Track,
        related_name='students',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        default=get_default_track
    )


    # Email Verification Fields
    verification_code = models.CharField(max_length=32, blank=True, null=True)
    verified = models.BooleanField(default=False)  

    # Permissions & Groups
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='student_set',  
        blank=True
    )

    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='student_permissions_set',  
        blank=True
    )

    # Authentication Field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'students'

    def __str__(self):
        """Returns the student's name and their assigned track."""
        return f'{self.first_name} {self.last_name} - {self.track.name if self.track else "No Track Assigned"}'

    def generate_verification_code(self):
        """Generates a random verification code for email verification."""
        if not self.verification_code:
            self.verification_code = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
            self.save()

    @property
    def full_name(self):
        """Property to return the full name as a combination of first and last name."""
        return f"{self.first_name} {self.last_name}"
