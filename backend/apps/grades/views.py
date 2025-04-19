from rest_framework import generics, permissions, status
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

    def put(self, request, *args, **kwargs):
        """
        Handle PUT request to update the grade.
        """
        grade = self.get_object()
        logger.debug(f"[PUT] Incoming data for grade ID {grade.id}: {request.data}")

        # Allow partial updates to prevent requiring all fields
        serializer = self.get_serializer(grade, data=request.data, partial=True, context={'request': request})

        if serializer.is_valid():
            try:
                self.perform_update(serializer)
                logger.info(f"[PUT] Grade ID {grade.id} successfully updated by {request.user.username}")
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"[PUT] Exception during update of grade ID {grade.id}: {str(e)}")
                return Response({'detail': 'An error occurred while updating the grade.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            logger.warning(f"[PUT] Validation failed for grade ID {grade.id}: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        """
        Handle DELETE request to delete a grade.
        """
        grade = self.get_object()
        try:
            grade.delete()
            logger.info(f"Grade with ID {grade.id} deleted by {request.user.username}.")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting grade with ID {grade.id}: {str(e)}")
            return Response({"error": "Failed to delete grade."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        if not student_id:
            logger.error("No student ID provided.")
            return Grade.objects.none()

        return Grade.objects.filter(student__id=student_id).select_related('student', 'assignment', 'course')
