from apps.tracks.models import Track
from rest_framework import serializers
from .models import Course
from rest_framework import serializers
from apps.staff_members.models import StaffMember

from rest_framework import serializers
from .models import Course, StaffMember
# class CourseSerializer(serializers.ModelSerializer):
#     instructor = serializers.PrimaryKeyRelatedField(
#         queryset=StaffMember.objects.all(), required=False, allow_null=True
#     )
#     tracks = serializers.PrimaryKeyRelatedField(
#         queryset=Track.objects.all(), many=True, write_only=True
#     )

#     class Meta:
#         model = Course
#         fields = ['id', 'name', 'description', 'created_at', 'instructor', 'tracks']

#     def create(self, validated_data):
#         # Extract instructor and tracks from the validated data
#         instructor = validated_data.pop('instructor', None)
#         tracks = validated_data.pop('tracks', [])

#         # Create the course instance
#         course = Course.objects.create(**validated_data)

#         # If an instructor is provided, associate it with the course
#         if instructor:
#             course.instructor = instructor
#             course.save()

#         # Add many-to-many relationships for tracks
#         course.tracks.set(tracks)

#         return course
from rest_framework import serializers
from .models import Course, StaffMember, Track

from rest_framework import serializers
from .models import Course, StaffMember, Track

class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.SerializerMethodField()
    tracks = serializers.PrimaryKeyRelatedField(
        queryset=Track.objects.all(), many=True, write_only=True
    )

    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'created_at', 'instructor', 'instructor_name', 'tracks']

    def get_instructor_name(self, obj):
        """
        Custom method to get the full name of the instructor.
        """
        if obj.instructor:
            # Assuming instructor has a 'get_full_name()' method or a 'name' field
            return obj.instructor.get_full_name()  # or obj.instructor.name if no get_full_name()
        return None

    def create(self, validated_data):
        """
        Override the create method to handle associating tracks and instructor with the course.
        """
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
        if tracks:
            course.tracks.set(tracks)

        # Return the course instance
        return course

class MinimalCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name']
        
# Update Course Instructor
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
        # Hash the password before saving
        validated_data['password'] = make_password(validated_data['password'])

        # Remove the 'course_id' from validated data before creating StaffMember
        course_id = validated_data.pop('course_id', None)

        # Create the StaffMember instance using the StaffMemberSerializer
        staff_member_serializer = StaffMemberSerializer(data=validated_data)
        if staff_member_serializer.is_valid():
            staff_member = staff_member_serializer.save()

            # If course_id exists, associate the instructor with the Course
            if course_id:
                try:
                    # Get the course by its ID
                    course = Course.objects.get(id=course_id)
                    
                    # Assign the staff member (instructor) to the course
                    course.instructor = staff_member  # Assign the instructor
                    course.save()  # Save the course to reflect the changes

                except Course.DoesNotExist:
                    raise serializers.ValidationError(f"Course with ID {course_id} does not exist.")
            
            return staff_member
        else:
            raise serializers.ValidationError(staff_member_serializer.errors)
