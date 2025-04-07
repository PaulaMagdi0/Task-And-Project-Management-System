from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import AssignmentSubmission
from apps.courses.models import Course
from apps.assignments.models import Assignment
from apps.tracks.models import Track  # Assuming you have a Track model

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentSubmission
        fields = ['id', 'student', 'course', 'assignment', 'file', 'file_url', 'submission_date']
        read_only_fields = ['submission_date', 'student']  # Student is set automatically

    def validate(self, data):
        request = self.context.get('request')
        student = request.user if request else None
        course = data.get('course')
        assignment = data.get('assignment')

        # Ensure the user is a student
        if not hasattr(student, 'student'):  # Make sure it's a Student instance
            raise serializers.ValidationError("User is not a registered student")
        
        student_track = student.student_profile.track  # Assuming this is correct
        if not student_track:
            raise serializers.ValidationError("Student is not enrolled in any track")

        # Check if course is assigned to the student's track
        if not student_track.courses.filter(id=course.id).exists():
            raise serializers.ValidationError("This course is not part of your track")

        # Check if assignment belongs to the course
        if assignment.course != course:
            raise serializers.ValidationError("This assignment doesn't belong to the specified course")

        # Check for duplicate submissions (optional)
        if AssignmentSubmission.objects.filter(student=student, assignment=assignment).exists():
            raise serializers.ValidationError("You've already submitted this assignment")

        # Automatically set the student to the current user
        data['student'] = student

        return data

    def create(self, validated_data):
        # Additional checks before creation
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError(str(e))

    class Meta:
        model = AssignmentSubmission
        fields = ['id', 'student', 'course', 'assignment', 'file', 'file_url', 'submission_date']
        read_only_fields = ['submission_date', 'student']  # Student is set automatically

    def validate(self, data):
        request = self.context.get('request')
        student = request.user if request else None
        course = data.get('course')
        assignment = data.get('assignment')

        # 1. Check if student is in any track
        if not hasattr(student, 'student_profile'):
            raise serializers.ValidationError("User is not a registered student")
        
        student_track = student.student_profile.track
        if not student_track:
            raise serializers.ValidationError("Student is not enrolled in any track")

        # 2. Check if course is assigned to the student's track
        if not student_track.courses.filter(id=course.id).exists():
            raise serializers.ValidationError("This course is not part of your track")

        # 3. Check if assignment belongs to the course
        if assignment.course != course:
            raise serializers.ValidationError("This assignment doesn't belong to the specified course")

        # 4. Check for duplicate submissions (optional)
        if AssignmentSubmission.objects.filter(
            student=student, 
            assignment=assignment
        ).exists():
            raise serializers.ValidationError("You've already submitted this assignment")

        # Automatically set the student to the current user
        data['student'] = student

        return data

    def create(self, validated_data):
        # Additional checks before creation
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError(str(e))