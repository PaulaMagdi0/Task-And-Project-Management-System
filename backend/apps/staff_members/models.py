from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.core.exceptions import ValidationError

class StaffMember(AbstractUser):
    # Override email field to be unique
    email = models.EmailField(unique=True)

    ROLE_CHOICES = (
        ("branch_manager", "Branch Manager"),
        ("supervisor", "Supervisor"),
        ("instructor", "Instructor"),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="instructor")
    phone = models.CharField(max_length=15, blank=True, null=True)

    groups = models.ManyToManyField(Group, related_name="staffmember_set", blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name="staffmember_permissions_set", blank=True)

    # Use email as the unique identifier for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']  # You can adjust this as needed

    class Meta:
        db_table = 'staff_member'

    def save(self, *args, **kwargs):
        if self.role not in dict(self.ROLE_CHOICES):
            raise ValidationError("Invalid role for StaffMember.")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"
