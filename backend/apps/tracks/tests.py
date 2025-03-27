from django.test import TestCase
from apps.tracks.models import Track

class TrackModelTest(TestCase):
    def test_create_track(self):
        """Test creating a track"""
        track = Track.objects.create(name="Python Development", description="Advanced Python course")
        self.assertEqual(track.name, "Python Development")
        self.assertEqual(track.description, "Advanced Python course")
