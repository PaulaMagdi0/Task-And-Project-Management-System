from rest_framework import serializers
from .models import Grade

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = "__all__"
        read_only_fields = ["student", "assignment", "submission", "course", "graded_date", "created_at"]

    def to_representation(self, instance):
        """Customize API response based on visibility settings"""
        data = super().to_representation(instance)

        # Hide score & feedback if they are not visible
        if not instance.is_score_visible:
            data.pop("score", None)
        if not instance.is_feedback_visible:
            data.pop("feedback", None)

        return data

    def update(self, instance, validated_data):
        """Allow only instructors to modify certain fields"""
        user = self.context["request"].user  # Get the logged-in user

        # Only instructors/supervisors can update score, feedback, and visibility
        if not user.is_staff:  
            restricted_fields = {"score", "feedback", "is_score_visible", "is_feedback_visible"}
            for field in restricted_fields:
                validated_data.pop(field, None)

        return super().update(instance, validated_data)
