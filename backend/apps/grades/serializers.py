from rest_framework import serializers
from django.core.exceptions import PermissionDenied
from .models import Grade
from apps.submission.models import AssignmentSubmission
from datetime import datetime
from django.utils.timezone import now
import logging

logger = logging.getLogger(__name__)

class GradeSerializer(serializers.ModelSerializer):
    submission = serializers.PrimaryKeyRelatedField(
        queryset=AssignmentSubmission.objects.all(),
        required=True
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make 'submission' read-only during updates
        if self.instance is not None:
            self.fields['submission'].read_only = True
            self.fields['submission'].required = False

    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'track', 'assignment', 'submission', 'course',
            'score', 'feedback', 'graded_date', 'created_at'
        ]
        read_only_fields = [
            'id', 'student', 'track', 'assignment', 'course', 
            'graded_date', 'created_at'
        ]

    def validate_score(self, value):
        """Ensure score is between 0-10"""
        if not (0 <= value <= 10):
            raise serializers.ValidationError("Score must be between 0 and 10.")
        return value

    def validate(self, data):
        """Validate permissions and required fields"""
        request = self.context.get('request')

        if request and request.method in ['POST', 'PUT', 'PATCH']:
            if not (request.user.is_staff or getattr(request.user, 'role', '') == 'instructor'):
                raise PermissionDenied("Only instructors can grade assignments.")

        if request and request.method == 'POST':
            submission = data.get('submission')
            if not submission:
                raise serializers.ValidationError({"submission": "This field is required."})
            if not AssignmentSubmission.objects.filter(id=submission.id).exists():
                raise serializers.ValidationError({"submission": "Invalid submission ID."})

        return data

    def create(self, validated_data):
        """Create a new grade, automatically setting the course and track."""
        submission = validated_data['submission']
        student = submission.student
        assignment = submission.assignment

        # Check if grade already exists
        if Grade.objects.filter(student=student, assignment=assignment, submission=submission).exists():
            raise serializers.ValidationError("This submission has already been graded.")

        # Automatically set course and track from the submission and student
        validated_data.update({
            'student': student,
            'assignment': assignment,
            'course': assignment.course,  # Set the course from the assignment
            'track': student.track if student.track else None,  # Set track from student (if available)
            'graded_date': now()
        })

        # Create the grade instance
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update an existing grade."""
        if 'score' in validated_data or 'feedback' in validated_data:
            validated_data['graded_date'] = now()  # Update graded_date when score or feedback is updated
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """Return a custom representation of the grade instance."""
        data = super().to_representation(instance)
        return data
