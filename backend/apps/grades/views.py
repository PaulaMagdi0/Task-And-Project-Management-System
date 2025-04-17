from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from .models import Grade
from .serializers import GradeSerializer
import logging

# Set up logging
logger = logging.getLogger(__name__)

class GradePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class GradeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    lookup_field = 'id'

class GradeListView(generics.ListCreateAPIView):
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = GradePagination

    def get_queryset(self):
        user = self.request.user
        instructor_id = self.request.query_params.get('instructor')
        queryset = Grade.objects.select_related('student', 'assignment', 'course')

        logger.debug(f"Initial queryset: {queryset}")

        # Handle staff users
        if user.is_staff:
            if instructor_id:
                try:
                    instructor_id = int(instructor_id)
                    queryset = queryset.filter(assignment__instructor__id=instructor_id)
                    logger.debug(f"Queryset after instructor filter: {queryset}")
                except (ValueError, TypeError):
                    logger.warning("Invalid instructor ID provided, returning empty queryset.")
                    return queryset.none()
            return queryset

        # Handle student users
        if hasattr(user, 'student'):
            queryset = queryset.filter(student=user.student)
            logger.debug(f"Queryset after student filter: {queryset}")
        
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        logger.debug(f"Returning grades: {serializer.data}")
        return Response({
            "count": len(serializer.data),
            "grades": serializer.data,
        })

class StudentGradeListView(generics.ListAPIView):
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        student_id = self.kwargs.get('studentid')
        return Grade.objects.filter(student__id=student_id).select_related('student', 'assignment', 'course')
