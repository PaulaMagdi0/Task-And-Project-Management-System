from django.test import TestCase
from apps.tracks.models import Track
from apps.accounts.models import CustomUser
from apps.courses.models import Course

class CourseModelTest(TestCase):
    def setUp(self):
        """Set up test data before each test"""
        self.supervisor = CustomUser.objects.create_user(
            username="supervisor1", role="supervisor"
        )
        self.instructor = CustomUser.objects.create_user(
            username="instructor1", role="instructor"
        )
        self.student = CustomUser.objects.create_user(
            username="student1", role="student"
        )

        self.track = Track.objects.create(
            name="AI Track", description="Artificial Intelligence Track", supervisor=self.supervisor
        )

    def test_create_course_with_valid_instructor(self):
        """Test creating a course with a valid instructor"""
        course = Course.objects.create(
            name="Machine Learning",
            description="ML Course",
            track=self.track,
            instructor=self.instructor,
        )
        self.assertEqual(course.name, "Machine Learning")
        self.assertEqual(course.instructor, self.instructor)

    def test_create_course_without_instructor(self):
        """Test creating a course without an instructor"""
        course = Course.objects.create(
            name="Deep Learning",
            description="DL Course",
            track=self.track,
            instructor=None,  # No instructor assigned
        )
        self.assertIsNone(course.instructor)

    def test_prevent_non_instructor_assignment(self):
        """Ensure only users with 'instructor' role can be assigned"""
        with self.assertRaises(ValueError):
            Course.objects.create(
                name="Python for AI",
                description="Python Course",
                track=self.track,
                instructor=self.student,  # ❌ This should fail
            )

    def test_prevent_duplicate_course_names_in_track(self):
        """Ensure the same course name cannot exist in the same track"""
        Course.objects.create(
            name="Computer Vision",
            description="CV Course",
            track=self.track,
            instructor=self.instructor,
        )
        with self.assertRaises(Exception):  # IntegrityError or ValidationError
            Course.objects.create(
                name="Computer Vision",
                description="Another CV Course",
                track=self.track,
                instructor=self.instructor,
            )

    def test_allow_duplicate_course_names_in_different_tracks(self):
        """Ensure the same course name can exist in different tracks"""
        another_track = Track.objects.create(
            name="Data Science Track", description="Data Science Specialization", supervisor=self.supervisor
        )

        Course.objects.create(
            name="NLP",
            description="Natural Language Processing",
            track=self.track,
            instructor=self.instructor,
        )

        try:
            Course.objects.create(
                name="NLP",  # ✅ Same name, different track
                description="NLP in Data Science",
                track=another_track,
                instructor=self.instructor,
            )
        except Exception:
            self.fail("Course names should be unique within a track, but allowed in different tracks.")

