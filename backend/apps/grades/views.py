from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Grade
from .serializers import GradeSerializer

class GradePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class GradeListView(generics.ListAPIView):
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]  # Ensure user is authenticated
    pagination_class = GradePagination

    def get_queryset(self):
        user = self.request.user
        instructor_id = self.request.query_params.get('instructor', None)
        queryset = Grade.objects.select_related('student', 'assignment', 'course')

        # If the user is an admin or instructor
        if user.is_staff:
            if instructor_id:
                try:
                    instructor_id = int(instructor_id)
                    return queryset.filter(assignment__instructor__id=instructor_id)  # Filter by instructor
                except (ValueError, TypeError):
                    return queryset.none()  # Invalid instructor ID
            return queryset  # Return all grades for staff/instructor

        # If the user is a student, filter grades by their student profile
        if hasattr(user, 'student'):
            return queryset.filter(student=user.student)
        
        return queryset.none()  # Return no grades for non-student, non-staff users

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        # Handle pagination if page exists
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                "grades": serializer.data
            })

        # If no pagination, return all results
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "count": len(serializer.data),
            "page": 1,
            "page_size": len(serializer.data),
            "grades": serializer.data
        })
