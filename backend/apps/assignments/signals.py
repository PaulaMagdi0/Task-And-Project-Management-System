# In apps/assignments/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AssignmentStudent

@receiver(post_save, sender=AssignmentStudent)
def set_track_on_assignmentstudent(sender, instance, created, **kwargs):
    if created:  # Only set the track when the record is first created
        # Ensure that track is set based on the course of the student
        if instance.course and instance.student:
            # If the course has tracks, assign the first one
            if instance.course.tracks.exists():
                instance.track = instance.course.tracks.first()  # Assign the first track
                instance.save()
