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
from rest_framework import serializers
from .models import Assignment, AssignmentStudent
from apps.tracks.models import  Track
from apps.student.models import Student

from rest_framework import serializers

from rest_framework import serializers
from .models import Assignment, Track, Student, AssignmentStudent

from rest_framework import serializers
from .models import Assignment, Track, Student, AssignmentStudent

class AssignmentSerializer(serializers.ModelSerializer):
    track = serializers.PrimaryKeyRelatedField(queryset=Track.objects.all(), write_only=True, required=True)
    assigned_to_all = serializers.BooleanField(write_only=True, default=False)
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
    track_name = serializers.CharField(source='track.name', read_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'due_date', 'end_date', 'assignment_type', 'course', 'description', 
            'file', 'file_url', 'created_at', 'assigned_to', 'course_name', 'track_name', 
            'track', 'assigned_to_all'
        ]
        read_only_fields = ['created_at']

    def get_track_name(self, obj):
        assignment_students = AssignmentStudent.objects.filter(assignment=obj)
        track_names = {assignment_student.track.name if assignment_student.track else "No track assigned" 
                       for assignment_student in assignment_students}
        return ", ".join(track_names) if track_names else "No track assigned"

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
        track = validated_data.pop('track', None)
        assigned_to_all = validated_data.pop('assigned_to_all', False)

        # Create the assignment itself
        assignment = Assignment.objects.create(track=track, **validated_data)

        # Assign students if 'assigned_to_all' is True, else assign selected students
        if assigned_to_all:
            # Fetch all students in the given track and remove duplicates
            students = Student.objects.filter(track=track).distinct()
            assigned_to_data = students

        # Create a set to track students already assigned to prevent duplicates
        assigned_students = set()

        # Loop through each student and check for duplicates before creating
        for student in assigned_to_data:
            # Log the check for duplicates
            print(f"🔍 Checking if student {student.id} is already assigned to assignment {assignment.id}")

            # If student is already assigned, skip
            if student in assigned_students:
                print(f"❌ Student {student.id} is already assigned, skipping...")
                continue
            
            # Check if the student is already assigned to this assignment
            if not AssignmentStudent.objects.filter(assignment=assignment, student=student).exists():
                # Only create a new AssignmentStudent entry if it doesn't already exist
                course = student.track.courses.first() if student.track else None
                AssignmentStudent.objects.create(
                    assignment=assignment,
                    student=student,
                    course=course,
                    track=student.track
                )
                print(f"✅ Assigned student {student.id} to assignment {assignment.id}")

                # Add the student to the set of assigned students
                assigned_students.add(student)
            else:
                print(f"❌ Student {student.id} is already assigned to assignment {assignment.id}, skipping...")

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
