from rest_framework import generics, permissions
from .models import Grade
from .serializers import GradeSerializer

class GradeListView(generics.ListCreateAPIView):
    serializer_class = GradeSerializer

    def get_queryset(self):
        """Filter grades based on user role"""
        user = self.request.user

        if user.is_staff:  # Instructors/Supervisors see all grades
            return Grade.objects.all()
        else:  # Students see only their own grades (if visible)
            return Grade.objects.filter(
                student=user, 
                is_score_visible=True  # Only visible grades
            )

    def perform_create(self, serializer):
        """Ensure students cannot set score/feedback when creating a grade"""
        user = self.request.user

        if not user.is_staff:  # Students cannot set score, feedback, or visibility
            serializer.save(student=user, score=None, feedback=None)
        else:
            serializer.save()
