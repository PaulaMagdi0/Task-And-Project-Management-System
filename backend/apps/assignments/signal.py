from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Assignment
from apps.student.models import Student
from apps.courses.models import Course

@receiver(post_save, sender=Assignment)
def assign_students_to_assignment(sender, instance, created, **kwargs):
    if created:  # Only run when a new assignment is created
        if instance.course:
            # Get all students in the course
            students_in_course = Student.objects.filter(course=instance.course)
            instance.assigned_to.set(students_in_course)
            instance.save()
