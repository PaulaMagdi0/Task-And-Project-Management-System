from rest_framework import serializers
from .models import Course
from apps.staff_members.models import StaffMember
from apps.tracks.models import Track
from apps.student.models import Intake
from django.contrib.auth.hashers import make_password
from apps.staff_members.serializers import StaffMemberSerializer

class IntakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Intake
        fields = ['id', 'name', 'track']

class CourseSerializer(serializers.ModelSerializer):
    instructor = serializers.PrimaryKeyRelatedField(
        queryset=StaffMember.objects.all(), allow_null=True, required=False
    )
    instructor_name = serializers.SerializerMethodField()
    tracks = serializers.PrimaryKeyRelatedField(
        queryset=Track.objects.all(), many=True, write_only=True
    )
    intake = serializers.PrimaryKeyRelatedField(
        queryset=Intake.objects.all(), allow_null=True, required=False
    )
    available_intakes = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'created_at', 'instructor', 'instructor_name', 'tracks', 'intake', 'available_intakes']
        read_only_fields = ['created_at', 'instructor_name', 'available_intakes']

    def get_instructor_name(self, obj):
        """
        Custom method to get the full name of the instructor.
        """
        if obj.instructor:
            return obj.instructor.get_full_name() or obj.instructor.username
        return None

    def get_available_intakes(self, obj):
        """
        Get intakes associated with the course's tracks.
        """
        track_ids = obj.tracks.values_list('id', flat=True)
        intakes = Intake.objects.filter(track__id__in=track_ids)
        return IntakeSerializer(intakes, many=True).data

    def validate(self, data):
        """
        Validate that the intake belongs to one of the selected tracks.
        """
        intake = data.get('intake')
        tracks = data.get('tracks', [])
        if intake and tracks:
            if not Intake.objects.filter(id=intake.id, track__in=tracks).exists():
                raise serializers.ValidationError("Selected intake must belong to one of the course's tracks.")
        return data

    def create(self, validated_data):
        """
        Override the create method to handle associating tracks, instructor, and intake with the course.
        """
        instructor = validated_data.pop('instructor', None)
        tracks = validated_data.pop('tracks', [])
        intake = validated_data.pop('intake', None)
        course = Course.objects.create(**validated_data)
        if instructor:
            course.instructor = instructor
        if intake:
            course.intake = intake
        if tracks:
            course.tracks.set(tracks)
        course.save()
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