# ai_recommendations/models.py
from django.db import models

class Recommendation(models.Model):
    course_name = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    description = models.TextField()
    course_id = models.IntegerField()
    difficulty_level = models.CharField(max_length=50)

    def __str__(self):
        return self.title
