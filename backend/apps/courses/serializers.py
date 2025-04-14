
from apps.tracks.models import Track  # Import Track model
from rest_framework import serializers
from .models import Course
from apps.tracks.models import Track

class CourseSerializer(serializers.ModelSerializer):
    # Serialize the related Track instances for the Many-to-Many relationship
    tracks = serializers.PrimaryKeyRelatedField(queryset=Track.objects.all(), many=True)

    class Meta:
        model = Course
        fields = "__all__"

    def create(self, validated_data):
        # Create the course object
        tracks_data = validated_data.pop('tracks')
        course = super().create(validated_data)
        
        # Add related tracks to the course
        for track in tracks_data:
            course.tracks.add(track)

        return course

class MinimalCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name']