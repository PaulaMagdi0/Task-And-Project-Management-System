from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Grade
from .serializers import GradeSerializer
from django.utils import timezone

class GradeListView(generics.ListCreateAPIView):
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter grades based on user role with optimized queries"""
        user = self.request.user
        
        if user.is_staff:
            # Staff can see all grades with related objects prefetched
            return Grade.objects.select_related(
                'student', 'assignment', 'course'
            ).all()
        
        # Students only see their own visible grades
        return Grade.objects.filter(
            student=user
        ).select_related(
            'assignment', 'course'
        ).filter(
            is_score_visible=True
        )

    def perform_create(self, serializer):
        """Secure grade creation with role-based permissions"""
        user = self.request.user
        data = serializer.validated_data

        if not user.is_staff:
            # Students can only create placeholder grades
            if any(field in data for field in ['score', 'feedback', 'is_score_visible', 'is_feedback_visible']):
                raise PermissionDenied(
                    "Students cannot set grades, feedback, or visibility settings"
                )
            serializer.save(
                student=user,
                score=None,
                feedback=None,
                is_score_visible=False,
                is_feedback_visible=False,
                graded_date=None
            )
        else:
            # Instructors can create full grade records
            if 'graded_date' not in data:
                serializer.save