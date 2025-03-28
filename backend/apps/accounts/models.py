from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ("student", "Student"),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    groups = models.ManyToManyField(Group, related_name="customuser_set", blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name="customuser_permissions_set", blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
