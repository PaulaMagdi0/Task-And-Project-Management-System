from rest_framework import serializers
from .models import Course
from apps.staff_members.models import StaffMember
from apps.tracks.models import Track
from django.contrib.auth.hashers import make_password
from apps.staff_members.serializers import StaffMemberSerializer  # Correct import

class CourseSerializer(serializers.ModelSerializer):
    instructor = serializers.PrimaryKeyRelatedField(
        queryset=StaffMember.objects.all(), allow_null=True, required=False
    )
    instructor_name = serializers.SerializerMethodField()
    tracks = serializers.PrimaryKeyRelatedField(
        queryset=Track.objects.all(), many=True, write_only=True
    )

    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'created_at', 'instructor', 'instructor_name', 'tracks']
        read_only_fields = ['created_at', 'instructor_name']

    def get_instructor_name(self, obj):
        """
        Custom method to get the full name of the instructor.
        """
        if obj.instructor:
            return obj.instructor.get_full_name() or obj.instructor.username
        return None

    def create(self, validated_data):
        """
        Override the create method to handle associating tracks and instructor with the course.
        """
        instructor = validated_data.pop('instructor', None)
        tracks = validated_data.pop('tracks', [])
        course = Course.objects.create(**validated_data)
        if instructor:
            course.instructor = instructor
            course.save()
        if tracks:
            course.tracks.set(tracks)
        return course

class MinimalCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name']

class CourseInstructorUpdateSerializer(serializers.ModelSerializer):
    instructor_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Course
        fields = ['instructor_id']

class CreateInstructorSerializer(serializers.ModelSerializer):
    course_id = serializers.IntegerField(required=False, write_only=True)

    class Meta:
        model = StaffMember
        fields = [
            'username', 'password', 'first_name', 'last_name', 'email',
            'phone', 'branch', 'course_id'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        course_id = validated_data.pop('course_id', None)
        staff_member_serializer = StaffMemberSerializer(data=validated_data)
        if staff_member_serializer.is_valid():
            staff_member = staff_member_serializer.save()
            if course_id:
                try:
                    course = Course.objects.get(id=course_id)
                    course.instructor = staff_member
                    course.save()
                except Course.DoesNotExist:
                    raise serializers.ValidationError(f"Course with ID {course_id} does not exist.")
            return staff_member
        else:
            raise serializers.ValidationError(staff_member_serializer.errors)