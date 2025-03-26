from django.test import TestCase
from .models import CustomUser

class CustomUserTest(TestCase):
    def test_create_user(self):
        user = CustomUser.objects.create(username="testuser", role="student")
        self.assertEqual(user.role, "student")
