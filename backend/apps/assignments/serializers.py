from rest_framework import serializers
from .models import Assignment

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['id', 'title', 'due_date', 'assignment_type', 'course', 'description', 'file', 'created_at']
    
    # Ensure the file field is handled correctly for Google Drive upload
    file = serializers.FileField(required=False)  # Allow file upload
