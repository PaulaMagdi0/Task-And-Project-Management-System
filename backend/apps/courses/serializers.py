from apps.tracks.models import Track
from rest_framework import serializers
from .models import Course
from rest_framework import serializers
from apps.staff_members.models import StaffMember

from rest_framework import serializers
from .models import Course, StaffMember

class CourseSerializer(serializers.ModelSerializer):
    instructor = serializers.PrimaryKeyRelatedField(queryset=StaffMember.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'created_at', 'instructor', 'tracks']

    def create(self, validated_data):
        # Check if instructor is provided or if it is allowed to be null
        instructor = validated_data.get('instructor', None)
        
        # Create the course instance without an instructor if it's null
        course = Course.objects.create(**validated_data)

        if instructor:
            # If instructor is provided, associate it with the course
            course.instructor = instructor
            course.save()

        return course

class MinimalCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name']