import logging
import os
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Assignment,AssignmentStudent
from .serializers import AssignmentSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from apps.student.models import Student
from apps.courses.models import Course
from apps.tracks.models import Track
from apps.submission.models import AssignmentSubmission 
from apps.submission.serializers import AssignmentSubmissionSerializer as SubmissionSerializer
from apps.tracks.serializers import TrackSerializer
from apps.courses.serializers import CourseSerializer
from apps.student.serializers import StudentSubmissionStatusSerializer


logger = logging.getLogger(__name__)
class AssignmentListView(generics.ListCreateAPIView):
    """
    GET: List all assignments
    POST: Create new assignment with optional file upload (saved locally) or Google Drive URL
    """
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = []  # Adjust as per your requirement

    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        file_url = self.request.data.get('file_url')
        assigned_to_id = self.request.data.get('assigned_to')  # Get the student ID

        try:
            assigned_to_instance = None
            if assigned_to_id:
                assigned_to_instance = Student.objects.get(id=assigned_to_id)

            if file:
                file_path = self.save_file_locally(file)
                logger.info(f"File saved locally: {file_path}")
                serializer.save(file_url=file_path, assigned_to=assigned_to_instance)
            elif file_url:
                serializer.save(file_url=file_url, assigned_to=assigned_to_instance)
            else:
                serializer.save(assigned_to=assigned_to_instance)

        except Student.DoesNotExist:
            raise ValidationError(f"No student found with ID {assigned_to_id}")
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise ValidationError(f"File upload failed: {str(e)}")

    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            response.data['message'] = "Assignment created successfully"
            return response
        except ValidationError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception("Assignment creation failed")
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def save_file_locally(self, file):
        """Saves the file to the local `uploads` directory"""
        uploads_dir = "uploads"
        os.makedirs(uploads_dir, exist_ok=True)  # Ensure the directory exists
        file_path = os.path.join(uploads_dir, file.name)

        with open(file_path, "wb") as f:
            for chunk in file.chunks():
                f.write(chunk)

        return file_path


class AssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve single assignment
    PUT: Full update assignment (replace file if new one provided)
    PATCH: Partial update assignment
    DELETE: Remove assignment and delete the file locally
    """
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = []  # Adjust as per your requirement
    lookup_field = 'pk'

    def get_object(self):
        return get_object_or_404(Assignment, pk=self.kwargs['pk'])

    def update(self, request, *args, **kwargs):
        try:
            response = super().update(request, *args, **kwargs)
            response.data['message'] = "Assignment updated successfully"
            return response
        except ValidationError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception("Assignment update failed")
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_destroy(self, instance):
        try:
            # Delete file locally if it exists
            if instance.file_url and os.path.exists(instance.file_url):
                os.remove(instance.file_url)
                logger.info(f"Deleted file: {instance.file_url}")

            instance.delete()
            logger.info(f"Assignment {instance.id} deleted successfully")
        except Exception as e:
            logger.error(f"Error deleting assignment: {str(e)}")
            raise ValidationError(f"Error deleting assignment: {str(e)}")

    def destroy(self, request, *args, **kwargs):
        try:
            super().destroy(request, *args, **kwargs)
            return Response(
                {"message": "Assignment deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )
        except ValidationError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception("Assignment deletion failed")
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

#Upcoming deadline
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upcoming_assignments(request, student_id):
    """Retrieve all assignments with upcoming end dates for a specific student based on their course and track."""
    
    try:
        # Fetch the student
        student = Student.objects.get(id=student_id)

        # Get the current date and time
        now = timezone.now()

        # Get the student's track (ensure the track exists)
        track = student.track
        if not track:
            return Response({"error": "Student is not assigned to any track"}, status=status.HTTP_400_BAD_REQUEST)

        # Get the courses associated with the student's track via CourseTrack
        courses_in_track = Course.objects.filter(coursetrack__track=track)

        # Ensure there are courses in the track for the student
        if not courses_in_track.exists():
            return Response({"error": "No courses found for the student's track"}, status=status.HTTP_404_NOT_FOUND)

        # Filter assignments based on student, courses, and track
        assignments = (
            Assignment.objects.filter(
                end_date__gt=now,  # Filter for assignments with a future end date
                assigned_to=student,  # Ensure the student is assigned to the assignment
                course__in=courses_in_track,  # Ensure the course is linked to the student's track
            )
            .order_by('end_date')  # Order by the end date (soonest first)
        )

        # If no assignments are found
        if not assignments.exists():
            return Response({"message": "No upcoming assignments found"}, status=status.HTTP_404_NOT_FOUND)

        # Serialize the assignments
        assignment_data = [
            {
                "id": assignment.id,
                "title": assignment.title,
                "end_date": assignment.end_date,
                "course": {
                    "id": assignment.course.id,
                    "name": assignment.course.name,
                },
                "assignment_type": assignment.get_assignment_type_display(),
                "description": assignment.description,
                "file_url": assignment.file_url  # Add file_url to the response
            }
            for assignment in assignments
        ]

        return Response(assignment_data, status=status.HTTP_200_OK)

    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in upcoming_assignments: {str(e)}", exc_info=True)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# views.py# views.py

# @api_view(['GET'])
# def track_course_assignments(request, track_id, course_id):
#     """Retrieve assignments and submissions for a specific track and course."""
#     try:
#         logger.info(f"Fetching data for track_id: {track_id}, course_id: {course_id}")
        
#         # 1. Fetch track and validate
#         try:
#             track = Track.objects.get(id=track_id)
#             logger.debug(f"Found track: {track}")
#         except Track.DoesNotExist:
#             logger.error(f"Track not found with id: {track_id}")
#             return Response(
#                 {"error": "Track not found."},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         # 2. Fetch course and validate it belongs to track
#         try:
#             course = Course.objects.get(id=course_id, track=track)
#             logger.debug(f"Found course: {course}")
#         except Course.DoesNotExist:
#             logger.error(f"Course not found with id: {course_id} in track {track_id}")
#             return Response(
#                 {"error": "Course not found in the specified track."},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         # 3. Fetch assignments with optimization
#         assignments = Assignment.objects.filter(course=course).select_related('course')
#         logger.debug(f"Found {assignments.count()} assignments")
        
#         # 4. Fetch submissions with optimization
#         submission_queryset = Submission.objects.filter(
#             assignment__in=assignments
#         ).select_related('student', 'assignment')
#         logger.debug(f"Found {submission_queryset.count()} submissions")

#         # 5. Serialize data with error handling
#         try:
#             response_data = {
#                 "track": TrackSerializer(track).data,
#                 "course": CourseSerializer(course).data,
#                 "assignments": AssignmentSerializer(assignments, many=True).data,
#                 "submissions": SubmissionSerializer(submission_queryset, many=True).data,
#             }
#             logger.debug("Serialization completed successfully")
#         except Exception as e:
#             logger.error(f"Serialization error: {str(e)}", exc_info=True)
#             return Response(
#                 {"error": "Data serialization failed."},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

#         return Response(response_data, status=status.HTTP_200_OK)
    
#     except       status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )Exception as e:
#         logger.error(f"Unexpected error: {str(e)}", exc_info=True)
#         return Response(
#             {"error": "An unexpected error occurred."},
# views.pyfrom rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Assignment, Course, Track
from .serializers import SafeAssignmentSerializer
import logging

logger = logging.getLogger(__name__)
@api_view(['GET'])
def track_course_assignments(request, track_id, course_id):
    """Retrieve assignments for a specific track and course without student assignments."""
    try:
        logger.info(f"Fetching assignments for track {track_id}, course {course_id}")
        
        # Ensure the track exists
        try:
            track = Track.objects.get(id=track_id)
        except Track.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Track not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Ensure the course exists and belongs to the track via CourseTrack
        try:
            course = Course.objects.get(id=course_id, coursetrack__track=track)
        except Course.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Course not found or does not belong to the provided track.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Retrieve assignments for the specific course
        assignments = Assignment.objects.filter(course=course)
        
        # Serialize the assignments
        assignment_serializer = SafeAssignmentSerializer(assignments, many=True)
        
        # Return response with assignments info
        return Response({
            'status': 'success',
            'count': len(assignment_serializer.data),
            'assignments': assignment_serializer.data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error in track_course_assignments: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': 'Failed to fetch assignments for the track and course',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
@api_view(['GET'])
def instructor_assignments(request, track_id, course_id, staff_id):
    """Retrieve assignments for the track, course, and instructor."""
    try:
        logger.info(f"Fetching assignments for instructor {staff_id}, track {track_id}, course {course_id}")
        
        # Ensure the staff member exists
        try:
            staff_member = Staff.objects.get(id=staff_id)
        except Staff.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Instructor not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Ensure the track and course exist
        try:
            track = Track.objects.get(id=track_id)
            course = Course.objects.get(id=course_id, track=track)
        except (Track.DoesNotExist, Course.DoesNotExist):
            return Response({
                'status': 'error',
                'message': 'Track or course not found or does not belong to the provided track.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Ensure the instructor is teaching the course
        if not staff_member in course.instructors.all():
            return Response({
                'status': 'error',
                'message': 'Instructor is not teaching this course.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Retrieve assignments for the specific course and track
        assignments = Assignment.objects.filter(course=course)  # Adjusted filter if necessary
        
        # Serialize the assignments
        assignment_serializer = SafeAssignmentSerializer(assignments, many=True)
        
        return Response({
            'status': 'success',
            'count': len(assignment_serializer.data),
            'assignments': assignment_serializer.data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error in instructor_assignments: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': 'Failed to fetch assignments for the instructor, track, or course',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(['GET'])
def get_submitters(request, assignment_id, track_id, course_id):
    # Get all submissions for this assignment in the specified track/course
    submissions = AssignmentSubmission.objects.filter(
        assignment_id=assignment_id,
        track_id=track_id,
        course_id=course_id
    ).select_related('student')

    # Get all students in the track who should have submitted
    all_students = Student.objects.filter(track_id=track_id)
    
    # Prepare response data
    submitters = [{
        'student_id': sub.student.id,
        'name': sub.student.full_name,
        'email': sub.student.email,
        'submitted': True,
        'submission_date': sub.submission_date,
        'file_url': sub.file_url or None
    } for sub in submissions]

    non_submitters = [{
        'student_id': student.id,
        'name': student.full_name,
        'email': student.email,
        'submitted': False
    } for student in all_students.exclude(
        id__in=[s.student.id for s in submissions]
    )]

    return Response({
        'total_students': all_students.count(),
        'submitted_count': len(submitters),
        'not_submitted_count': len(non_submitters),
        'submitters': submitters,
        'non_submitters': non_submitters
    })