from django.utils.timezone import now, timedelta
from django.test import TestCase
from apps.grades.models import Grade
from apps.assignments.models import Assignment
from apps.courses.models import Course
from apps.tracks.models import Track
from apps.accounts.models import CustomUser

class GradeModelTest(TestCase):
    def setUp(self):
        self.track = Track.objects.create(name="AI & Robotics", description="AI applications")
        self.course = Course.objects.create(name="Deep Learning", track=self.track)

        self.assignment = Assignment.objects.create(
            title="Neural Network",
            course=self.course,
            due_date=now() + timedelta(days=7),  # ✅ Ensure due_date is set
            assignment_type="homework"
        )

        self.student = CustomUser.objects.create(username="student1", role="student")

    def test_create_grade(self):
        """Test assigning a grade to a student"""
        grade = Grade.objects.create(
            assignment=self.assignment,
            student=self.student,
            score=95,
            course=self.course,  # ✅ Ensure course is set
        )

        self.assertEqual(grade.assignment, self.assignment)
        self.assertEqual(grade.student, self.student)
        self.assertEqual(grade.score, 95)
        self.assertEqual(grade.course, self.course)  # ✅ Confirm course is assigned
