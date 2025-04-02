from rest_framework import serializers
from .models import AssignmentSubmission

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentSubmission
        fields = ['id', 'student', 'course', 'assignment', 'file', 'file_url', 
                  'submission_date', 'feedback', 'mark', 'is_feedback_visible', 'is_mark_visible']
    
    # Allow feedback and mark to be updated only by instructors
    feedback = serializers.CharField(required=False, allow_blank=True)
    mark = serializers.FloatField(required=False, allow_null=True)
    is_feedback_visible = serializers.BooleanField(required=False)
    is_mark_visible = serializers.BooleanField(required=False)

    def update(self, instance, validated_data):
        # Ensure only instructors can update feedback, mark, and visibility
        user = self.context.get('request').user
        if not user.groups.filter(name="Instructors").exists():
            raise serializers.ValidationError("You do not have permission to add feedback and mark.")

        # Check if feedback, mark, or visibility are provided, and if so, update the fields
        feedback = validated_data.get('feedback', None)
        mark = validated_data.get('mark', None)
        is_feedback_visible = validated_data.get('is_feedback_visible', None)
        is_mark_visible = validated_data.get('is_mark_visible', None)

        if feedback is not None:
            instance.feedback = feedback
        if mark is not None:
            instance.mark = mark
        if is_feedback_visible is not None:
            instance.is_feedback_visible = is_feedback_visible
        if is_mark_visible is not None:
            instance.is_mark_visible = is_mark_visible

        instance.save()
        return instance

    def to_representation(self, instance):
        """Handle the logic for feedback and mark visibility for students"""
        user = self.context.get('request').user

        # If the student is not the user and feedback or mark is not visible, hide them
        if instance.student != user:
            if not instance.is_feedback_visible:
                instance.feedback = None
            if not instance.is_mark_visible:
                instance.mark = None

        return super().to_representation(instance)
