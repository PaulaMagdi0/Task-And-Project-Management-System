from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import AssignmentSubmission
from .serializers import AssignmentSubmissionSerializer
from django.contrib.auth.models import Group

class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Allow students to see only their own submissions, and instructors to view all submissions.
        """
        user = self.request.user
        if user.groups.filter(name="Instructors").exists():
            return AssignmentSubmission.objects.all()  # Instructors can view all submissions
        else:
            return AssignmentSubmission.objects.filter(student=user)  # Students can only see their submissions

    def perform_update(self, serializer):
        """
        Ensure that only instructors can update feedback and marks for submissions.
        """
        user = self.request.user
        if not user.groups.filter(name="Instructors").exists():
            raise PermissionDenied("You do not have permission to update feedback and marks.")

        # Ensure feedback, mark, and visibility are updated correctly
        feedback = serializer.validated_data.get('feedback', None)
        mark = serializer.validated_data.get('mark', None)
        is_feedback_visible = serializer.validated_data.get('is_feedback_visible', None)

        # Only allow updating these fields if provided
        if feedback is not None:
            serializer.instance.feedback = feedback
        if mark is not None:
            serializer.instance.mark = mark
        if is_feedback_visible is not None:
            serializer.instance.is_feedback_visible = is_feedback_visible

        # Save the updated submission
        serializer.save()

    def perform_create(self, serializer):
        """
        Handle file submissions by students. Ensure students can submit a file or URL.
        """
        # Check if the submission is before the due date
        assignment = serializer.validated_data['assignment']
        if assignment.due_date < timezone.now():
            raise PermissionDenied("You cannot submit the assignment after the due date.")

        # Save the submission (either file or URL, not both)
        serializer.save()
