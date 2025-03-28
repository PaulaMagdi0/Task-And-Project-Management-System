from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.core.exceptions import ValidationError

class StaffMember(AbstractUser):
    ROLE_CHOICES = (
        ("branch_manager", "Branch Manager"),
        ("supervisor", "Supervisor"),
        ("instructor", "Instructor"),
        ("student", "Student"),  # Still exists here for validation
    )
    password = models.CharField(max_length=255, null=False, default='defaultpassword')  # Default value
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")
    phone = models.CharField(max_length=15, blank=True, null=True)

    groups = models.ManyToManyField(Group, related_name="staffmember_set", blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name="staffmember_permissions_set", blank=True)

    class Meta:
        db_table = 'staff_members'  # Set custom table name

    def save(self, *args, **kwargs):
        from .models import CustomUser  # Import here to avoid circular imports

        if self.role == "student":
            raise ValidationError("Students should be created in CustomUser, not StaffMember.")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"
