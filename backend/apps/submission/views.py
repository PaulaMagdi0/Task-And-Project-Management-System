from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import AssignmentSubmission
from .serializers import AssignmentSubmissionSerializer
from django.utils import timezone
from django.contrib.auth.models import Group

class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]
    permission_classes = []

    def get_queryset(self):
        """
        Allow students to see only their own submissions, and instructors to view all submissions.
        """
        user = self.request.user
        
        if not user.is_authenticated:
            raise PermissionDenied("User is not authenticated.")

        # Log user's groups for debugging
        print(f"User groups: {user.groups.all()}")
        
        if user.groups.filter(name="Instructors").exists():
            return AssignmentSubmission.objects.all()  # Instructors see all submissions
        return AssignmentSubmission.objects.filter(student=user)  # Students see only their submissions

    def perform_create(self, serializer):
        """
        Handle file submissions by students. Ensure students can submit a file or URL, but not both.
        """
        user = self.request.user
        
        if not user.is_authenticated:
            raise PermissionDenied("User is not authenticated.")

        # Log the user for debugging
        print(f"Authenticated User: {user.username}")
        
        assignment = serializer.validated_data['assignment']

        # Ensure only students can submit assignments
        if user.groups.filter(name="Instructors").exists():
            raise PermissionDenied("Instructors cannot submit assignments.")

        # Check if submission is before the due date
        if assignment.due_date and assignment.due_date < timezone.now():
            raise PermissionDenied("You cannot submit the assignment after the due date.")

        # Validate file or file_url submission (one is required, but not both)
        file_submission = serializer.validated_data.get('file')
        file_url_submission = serializer.validated_data.get('file_url')

        if file_submission and file_url_submission:
            raise PermissionDenied("You cannot submit both a file and a URL.")
        if not file_submission and not file_url_submission:
            raise PermissionDenied("You must submit either a file or a URL.")

        # Save the submission with the current user as the student
        serializer.save(student=user)
