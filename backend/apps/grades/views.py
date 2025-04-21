from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from .models import Grade
from .serializers import GradeSerializer
import logging
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.grades.models import Grade
from rest_framework.generics import ListAPIView

# Set up logging
logger = logging.getLogger(__name__)

class GradePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class GradeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Grade.objects.all().order_by('graded_date')  # Ordering by graded_date as an example
    serializer_class = GradeSerializer
    lookup_field = 'id'

    def put(self, request, *args, **kwargs):
            """
            Handle PUT request to update the grade.
            """
            grade = self.get_object()
            logger.debug(f"[PUT] Incoming data for grade ID {grade.id}: {request.data}")

            # Perform partial update
            serializer = self.get_serializer(grade, data=request.data, partial=True, context={'request': request})

            if serializer.is_valid():
                try:
                    # Automatically ensure track and course are set properly from submission data
                    track = request.data.get('track', grade.track)  # Use the existing track if not provided
                    course = request.data.get('course', grade.course)  # Use the existing course if not provided
                    
                    # Update grade with track and course if needed
                    grade.track = track
                    grade.course = course

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

        if user.is_staff:
            if instructor_id:
                try:
                    instructor_id = int(instructor_id)
                    queryset = queryset.filter(assignment__instructor__id=instructor_id)
                except (ValueError, TypeError):
                    return queryset.none()
            return queryset

        if hasattr(user, 'student'):
            queryset = queryset.filter(student=user.student)
        
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        # Extract required identifiers
        student_id = data.get("student")
        assignment_id = data.get("assignment")
        course_id = data.get("course")
        track_id = data.get("track")

        # Validate presence of required fields
        if not all([student_id, assignment_id, course_id]):
            return Response(
                {"error": "Missing required fields: student, assignment, and course are mandatory."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if a valid submission exists
        try:
            submission = AssignmentSubmission.objects.get(
                student_id=student_id,
                assignment_id=assignment_id,
                course_id=course_id,
                track_id=track_id if track_id else None
            )
        except AssignmentSubmission.DoesNotExist:
            return Response(
                {"error": "No submission found for this student, assignment, course, and track."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Attach the correct submission ID to the data
        data["submission"] = submission.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
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

class GradeByStudentAndAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id, assignment_id):
        try:
            grade = Grade.objects.select_related('student', 'assignment').get(
                student__id=student_id,
                assignment__id=assignment_id
            )
            serializer = GradeSerializer(grade)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Grade.DoesNotExist:
            return Response({'detail': 'Grade not found for the given student and assignment.'}, status=status.HTTP_404_NOT_FOUND)

class InstructorTrackCourseGradesView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = GradeSerializer

    def get_queryset(self):
        user = self.request.user
        track_id = self.kwargs.get("track_id")
        course_id = self.kwargs.get("course_id")

        # Ensure user is the instructor of that course
        try:
            course = Course.objects.get(id=course_id, instructor=user)
        except Course.DoesNotExist:
            return Grade.objects.none()  # User not instructor of course

        return Grade.objects.select_related("student", "assignment", "track", "course").filter(
            course=course,
            track__id=track_id
        )
        
        
        
class StudentGradeByAssignmentView(generics.ListAPIView):
    serializer_class = GradeSerializer

    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        assignment_id = self.request.query_params.get('assignment')

        if not assignment_id:
            return Grade.objects.none()

        return Grade.objects.filter(student_id=student_id, assignment_id=assignment_id)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        if not queryset.exists():
            return Response({"detail": "No grades found for this student and assignment."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)