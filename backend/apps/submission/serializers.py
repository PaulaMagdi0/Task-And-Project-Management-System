from rest_framework import serializers
from .models import AssignmentSubmission
from apps.courses.models import Course
from apps.assignments.models import Assignment
from apps.assignments.serializers import AssignmentStudentSerializer
class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentSubmission
        fields = ['id', 'student', 'course', 'assignment', 'file', 'file_url', 'submission_date', 'track', 'submitted']
        read_only_fields = ['submission_date', 'student', 'track']  # Track is derived from the student automatically

    def validate(self, data):
        request = self.context.get('request')
        student = request.user if request else None
        course = data.get('course')
        assignment = data.get('assignment')

        if student:
            print(f"Student ID: {student.id}")
            print(f"Student Username: {student.username}")
            print(f"Student Email: {student.email}")
            print(f"Student Track ID: {student.track.id if student.track else 'None'}")

        # Ensure the user is a registered student
        if not hasattr(student, 'track'):  # Ensure the student has a track
            raise serializers.ValidationError("User is not a registered student or does not have a track.")

        student_track = student.track  # Directly access student's track

        if not student_track:
            raise serializers.ValidationError("Student is not enrolled in any track")

        # Ensure the course is part of the student's track
        if not student_track.courses.filter(id=course.id).exists():
            raise serializers.ValidationError("This course is not part of your track")

        # Ensure the assignment belongs to the course
        if assignment.course != course:
            raise serializers.ValidationError("This assignment doesn't belong to the specified course")

        # Check for duplicate submissions
        if AssignmentSubmission.objects.filter(student=student, assignment=assignment).exists():
            raise serializers.ValidationError("You've already submitted this assignment")

        # Automatically set the student and track to the current user and their track
        data['student'] = student
        data['track'] = student_track  # Automatically assign the track from student

        return data

    def create(self, validated_data):
        # Automatically mark as submitted when file is provided
        if validated_data.get('file') or validated_data.get('file_url'):
            validated_data['submitted'] = True
        else:
            validated_data['submitted'] = False  # Default to not submitted if no file or URL

        try:
            # Ensure track is assigned if it's not already set
            if validated_data.get('track') is None:
                request = self.context.get('request')
                student = request.user if request else None
                if student and student.track:
                    validated_data['track'] = student.track  # Set track based on student
                else:
                    raise serializers.ValidationError("Student has no track assigned.")

            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError(str(e))
class AssignmentDetailSerializer(serializers.ModelSerializer):
    assigned_students = AssignmentStudentSerializer(source='assignmentstudent_set', many=True)
    submissions = AssignmentSubmissionSerializer(source='assignmentsubmission_set', many=True)

    class Meta:
        model = Assignment
        fields = ['id', 'title', 'due_date', 'end_date', 'assignment_type', 'description', 'assigned_students', 'submissions']
