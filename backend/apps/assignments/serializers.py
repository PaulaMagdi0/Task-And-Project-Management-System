from rest_framework import serializers
from .models import Assignment

class AssignmentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(required=False, allow_null=True)  # For actual file upload
    file_url = serializers.URLField(required=False, allow_null=True)  # For Google Drive URL

    class Meta:
        model = Assignment
        fields = ['id', 'title', 'due_date', 'end_date', 'assignment_type', 'course', 'description', 'file', 'file_url', 'created_at']
        read_only_fields = ['created_at']  # created_at is auto-generated

    def validate(self, data):
        # Ensure either 'file' or 'file_url' is provided, not both
        if data.get('file') and data.get('file_url'):
            raise serializers.ValidationError("You cannot provide both 'file' and 'file_url'. Choose one.")
        return data

    def create(self, validated_data):
        # Remove the 'created_at' field from validated_data as it's auto-generated
        validated_data.pop('created_at', None)

        # Handle the creation process, including custom logic for 'file' and 'file_url'
        if 'file' not in validated_data and 'file_url' not in validated_data:
            raise serializers.ValidationError("Either 'file' or 'file_url' must be provided.")

        # Call the model's create method
        return Assignment.objects.create(**validated_data)
