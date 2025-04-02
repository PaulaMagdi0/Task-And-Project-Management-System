from rest_framework import serializers
from .models import AssignmentSubmission

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentSubmission
        fields = ['id', 'student', 'course', 'assignment', 'file', 'file_url', 'submission_date']
