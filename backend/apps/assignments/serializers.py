from rest_framework import serializers
from .models import Assignment , AssignmentStudent
from apps.student.models import Student  # Ensure correct import path
from apps.student.serializers import MinimalStudentSerializer  # Ensure correct import path
from apps.courses.serializers import MinimalCourseSerializer  # Ensure correct import path

class AssignmentSerializer(serializers.ModelSerializer):
    # Make sure file and file_url fields are optional
    file = serializers.FileField(required=False, allow_null=True)
    file_url = serializers.URLField(required=False, allow_null=True)
    
    # ForeignKey to Student model, but it's optional and can be null
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        required=False,  # Making it optional
        allow_null=True   # Allowing null if no student is assigned
    )

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'due_date', 'end_date', 'assignment_type',
            'course', 'description', 'assigned_to', 'file', 'file_url', 'created_at'
        ]
        read_only_fields = ['created_at']  # created_at should be read-only

    def validate(self, data):
        """
        Validate that either 'file' or 'file_url' is provided, but not both.
        """
        file = data.get('file')
        file_url = data.get('file_url')

        if file and file_url:
            raise serializers.ValidationError("You cannot provide both 'file' and 'file_url'. Choose one.")
        if not file and not file_url:
            raise serializers.ValidationError("Either 'file' or 'file_url' must be provided.")

        return data

    def create(self, validated_data):
        """
        Create a new Assignment instance. This method is called when creating an Assignment object.
        """
        return Assignment.objects.create(**validated_data)
class AssignmentStudentSerializer(serializers.ModelSerializer):
    student = MinimalStudentSerializer()
    course = MinimalCourseSerializer()
    
    class Meta:
        model = AssignmentStudent
        fields = ['student', 'course']
from rest_framework import serializers
from .models import Assignment

class SafeAssignmentSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)  # Assuming created_by is a ForeignKey to User
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'due_date', 'end_date', 'assignment_type',
            'course', 'description', 'file', 'file_url', 'created_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'created_by']  # created_at and created_by are read-only
