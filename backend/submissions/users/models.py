from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Add any custom fields here if needed
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'