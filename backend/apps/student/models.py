from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
import random
import string

class Student(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=100, blank=True, default='')  
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=50, default='student')

    # ✅ Email Verification Fields
    verification_code = models.CharField(max_length=32, blank=True, null=True)
    verified = models.BooleanField(default=False)  

    # ✅ Permissions & Groups
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

    # ✅ Authentication Field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'student_account'  

    def __str__(self):
        return self.email

    def generate_verification_code(self):
        """Generates a random verification code for email verification."""
        self.verification_code = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
        self.save()
