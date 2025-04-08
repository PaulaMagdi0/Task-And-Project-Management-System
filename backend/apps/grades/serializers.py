from rest_framework import serializers
from .models import Grade
from django.core.exceptions import PermissionDenied

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'assignment', 'submission', 'course',
            'score', 'feedback', 'is_score_visible', 'is_feedback_visible',
            'graded_date', 'created_at'
        ]
        read_only_fields = [
            'id', 'student', 'assignment', 'submission', 
            'course', 'graded_date', 'created_at'
        ]

    def to_representation(self, instance):
        """Customize API response based on visibility settings and user permissions"""
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        # Check if user has permission to view hidden grades
        can_view_hidden = request and (request.user.is_staff or 
                                     request.user == instance.assignment.instructor)

        # Handle score visibility
        if not instance.is_score_visible and not can_view_hidden:
            data.pop('score', None)
            data['score_hidden'] = True

        # Handle feedback visibility
        if not instance.is_feedback_visible and not can_view_hidden:
            data.pop('feedback', None)
            data['feedback_hidden'] = True

        return data

    def validate(self, data):
        """Validate grade updates based on user permissions"""
        request = self.context.get('request')
        if request and request.method == 'PATCH':
            # Check if user is trying to modify restricted fields
            if not request.user.is_staff:
                restricted_fields = {'score', 'feedback', 'is_score_visible', 'is_feedback_visible'}
                if any(field in data for field in restricted_fields):
                    raise PermissionDenied(
                        "Only instructors can modify grades and visibility settings"
                    )
        return data

    def update(self, instance, validated_data):
        """Handle grade updates with permission checks"""
        request = self.context.get('request')
        
        # Only instructors can update certain fields
        if request and not request.user.is_staff:
            validated_data.pop('score', None)
            validated_data.pop('feedback', None)
            validated_data.pop('is_score_visible', None)
            validated_data.pop('is_feedback_visible', None)

        # Automatically set graded date when score/feedback is updated
        if 'score' in validated_data or 'feedback' in validated_data:
            validated_data['graded_date'] = serializers.DateTimeField().to_representation(
                serializers.DateTimeField().get_default()
            )

        return super().update(instance, validated_data)