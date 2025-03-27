from django.test import TestCase
from apps.assignments.models import Assignment
from apps.courses.models import Course
from datetime import datetime, timedelta
from django.utils.timezone import make_aware

class AssignmentTestCase(TestCase):
    def setUp(self):
        """Setup test dependencies"""
        self.course = Course.objects.create(name="Django Basics")
    
    def test_create_assignment(self):
        """Test that assignment creation works"""
        due_date = make_aware(datetime.now() + timedelta(days=7))  # ✅ Set due_date
        assignment = Assignment.objects.create(
            title="ML Project",
            due_date=due_date,  # ✅ Ensure due_date is set
            assignment_type="homework",
            description="Build a model",
            course=self.course,
        )
        self.assertIsNotNone(assignment.id)  # ✅ Ensure assignment is saved
