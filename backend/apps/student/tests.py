from django.test import TestCase
from apps.student.models import Student

class CustomUserTestCase(TestCase):

    def setUp(self):
        """Set up test users"""
        self.student = CustomUser.objects.create(username="student1", role="student")
        self.instructor = CustomUser.objects.create(username="instructor1", role="instructor")

    def test_user_creation(self):
        """Test if users are created correctly"""
        self.assertEqual(self.student.username, "student1")
        self.assertEqual(self.student.role, "student")
        
        self.assertEqual(self.instructor.username, "instructor1")
        self.assertEqual(self.instructor.role, "instructor")

    def test_user_count(self):
        """Test if the correct number of users exist"""
        user_count = CustomUser.objects.count()
        self.assertEqual(user_count, 2)

    def test_user_roles(self):
        """Test role filtering"""
        students = CustomUser.objects.filter(role="student")
        instructors = CustomUser.objects.filter(role="instructor")

        self.assertEqual(students.count(), 1)
        self.assertEqual(instructors.count(), 1)
