from apps.tracks.models import Track
from rest_framework import serializers
from .models import Course
from rest_framework import serializers
from apps.staff_members.models import StaffMember

from rest_framework import serializers
from .models import Course, StaffMember
class CourseSerializer(serializers.ModelSerializer):
    instructor = serializers.PrimaryKeyRelatedField(
        queryset=StaffMember.objects.all(), required=False, allow_null=True
    )
    tracks = serializers.PrimaryKeyRelatedField(
        queryset=Track.objects.all(), many=True, write_only=True
    )

    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'created_at', 'instructor', 'tracks']

    def create(self, validated_data):
        # Extract instructor and tracks from the validated data
        instructor = validated_data.pop('instructor', None)
        tracks = validated_data.pop('tracks', [])

        # Create the course instance
        course = Course.objects.create(**validated_data)

        # If an instructor is provided, associate it with the course
        if instructor:
            course.instructor = instructor
            course.save()

        # Add many-to-many relationships for tracks
        course.tracks.set(tracks)

        return course


class MinimalCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name']