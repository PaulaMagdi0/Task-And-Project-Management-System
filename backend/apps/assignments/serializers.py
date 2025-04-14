from rest_framework import serializers
from .models import Assignment , AssignmentStudent
from apps.student.models import Student  # Ensure correct import path
from apps.student.serializers import MinimalStudentSerializer  # Ensure correct import path
from apps.courses.serializers import MinimalCourseSerializer  # Ensure correct import path

from rest_framework import serializers
from .models import Assignment, AssignmentStudent
from apps.student.models import Student
from apps.courses.models import Course
from apps.tracks.models import Track
class AssignmentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(required=False, allow_null=True)
    file_url = serializers.URLField(required=False, allow_null=True)

    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        many=True,
        required=False,
        allow_null=True,
        write_only=True
    )

    course_name = serializers.CharField(source='course.name', read_only=True)
    track_name = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            'id',
            'title',
            'due_date',
            'end_date',
            'assignment_type',
            'course',
            'description',
            'file',
            'file_url',
            'created_at',
            'assigned_to',
            'course_name',
            'track_name',
        ]
        read_only_fields = ['created_at']

    def get_track_name(self, obj):
        # Fetch all AssignmentStudent instances related to the given assignment
        assignment_students = AssignmentStudent.objects.filter(assignment=obj)
        
        track_names = set()  # Use a set to avoid duplicates

        # Loop through each AssignmentStudent and fetch the track name
        for assignment_student in assignment_students:
            if assignment_student.track:
                track_names.add(assignment_student.track.name)
            else:
                track_names.add("No track assigned")  # If no track is assigned, add a placeholder
        
        # If there are multiple track names, return them as a comma-separated list
        if track_names:
            return ", ".join(track_names)
        
        return "No track assigned"  # Return a default message if no tracks are found



    def validate(self, data):
        file = data.get('file')
        file_url = data.get('file_url')

        if file and file_url:
            raise serializers.ValidationError("You cannot provide both 'file' and 'file_url'. Choose one.")
        if not file and not file_url:
            raise serializers.ValidationError("Either 'file' or 'file_url' must be provided.")
        return data

    def create(self, validated_data):
        assigned_to_data = validated_data.pop('assigned_to', [])
        assignment = Assignment.objects.create(**validated_data)

        for student in assigned_to_data:
            track = student.track
            if not track:
                raise serializers.ValidationError(f"Student {student.id} does not have an assigned track.")

            course = track.courses.first()
            if not course:
                raise serializers.ValidationError(f"Track {track.name} for student {student.id} has no courses.")

            AssignmentStudent.objects.create(
                assignment=assignment,
                student=student,
                course=course,
                track=track  # Ensure the track is correctly assigned here
            )

        return assignment

class AssignmentStudentSerializer(serializers.ModelSerializer):
    student = MinimalStudentSerializer()
    course = MinimalCourseSerializer()
    
    class Meta:
        model = AssignmentStudent
        fields = ['student', 'course']
from rest_framework import serializers
from .models import Assignment

class SafeAssignmentSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)  # Assuming created_by is a ForeignKey to User
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'due_date', 'end_date', 'assignment_type',
            'course', 'description', 'file', 'file_url', 'created_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'created_by']  # created_at and created_by are read-only
