from django.test import TestCase
from .models import Course

class CourseTest(TestCase):
    def test_create_course(self):
        course = Course.objects.create(name="Python Basics", description="Intro to Python")
        self.assertEqual(course.name, "Python Basics")
