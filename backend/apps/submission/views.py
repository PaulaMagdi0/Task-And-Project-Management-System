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

    def get_queryset(self):
        """
        Allow instructors to view all submissions, but restrict students to see only their own submissions.
        """
        user = self.request.user
        
        if not user.is_authenticated:
            raise PermissionDenied("User is not authenticated.")
        
        # If the user is an instructor, return all submissions
        if user.groups.filter(name="Instructors").exists():
            return AssignmentSubmission.objects.all()  # Instructors see all submissions
        
        # Otherwise, students can only see their own submissions
        return AssignmentSubmission.objects.filter(student=user)

    def perform_create(self, serializer):
        """
        Instructors cannot submit assignments. This is overridden to prevent creating submissions.
        """
        user = self.request.user
        
        # Ensure that instructors cannot create submissions
        if user.groups.filter(name="Instructors").exists():
            raise PermissionDenied("Instructors cannot submit assignments.")
        
        # Allow students to submit their assignments as usual
        serializer.save(student=user)
