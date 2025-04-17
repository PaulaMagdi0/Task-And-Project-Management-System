from rest_framework import serializers
from .models import Grade
from django.core.exceptions import PermissionDenied
from apps.submission.models import AssignmentSubmission

class GradeSerializer(serializers.ModelSerializer):
    submission = serializers.PrimaryKeyRelatedField(
        queryset=AssignmentSubmission.objects.all(),
        required=True
    )

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
        
        # Check permissions for POST/PATCH
        if request and request.method in ['POST', 'PATCH']:
            if not (request.user.is_staff or request.user.role == 'instructor'):
                raise PermissionDenied("Only instructors can grade assignments.")
        
        # For POST requests, ensure submission exists
        if request and request.method == 'POST':
            if 'submission' not in data:
                raise serializers.ValidationError({"submission": "This field is required."})
            
            submission = data['submission']
            if not AssignmentSubmission.objects.filter(id=submission.id).exists():
                raise serializers.ValidationError({"submission": "Invalid submission ID."})

        return data

    def create(self, validated_data):
        submission = validated_data['submission']
        student = submission.student
        assignment = submission.assignment

        if Grade.objects.filter(student=student, assignment=assignment, submission=submission).exists():
            raise serializers.ValidationError("This submission has already been graded.")

        validated_data['student'] = student
        validated_data['assignment'] = assignment
        validated_data['course'] = assignment.course
        validated_data['track'] = assignment.track
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Handle updates with permission checks"""
        request = self.context.get('request')
        
        # Restrict field updates for non-staff
        if request and not request.user.is_staff:
            for field in ['score', 'feedback']:  # Removed visibility fields
                validated_data.pop(field, None)

        # Update graded_date if score/feedback changes
        if 'score' in validated_data or 'feedback' in validated_data:
            validated_data['graded_date'] = serializers.DateTimeField().to_representation(
                serializers.DateTimeField().get_default()
            )

        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """Basic representation without visibility controls"""
        data = super().to_representation(instance)
        # Removed visibility control logic since the fields don't exist
        return data