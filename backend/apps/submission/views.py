from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import AssignmentSubmission
from apps.staff_members.permissions import IsInstructor  # Assuming this is in permissions.py
import logging
import os
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Assignment
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from apps.student.models import Student
from apps.courses.models import Course
from apps.tracks.models import Track
from apps.assignments.models import AssignmentStudent 
from apps.assignments.serializers import AssignmentSerializer 
from rest_framework.views import APIView
from apps.assignments.serializers import AssignmentStudentSerializer

from .serializers import AssignmentSubmissionSerializer,AssignmentDetailSerializer

class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated, IsInstructor]  # Add IsInstructor permission

    def get_queryset(self):
        """
        Allow instructors to view all submissions, but restrict students to see only their own submissions.
        """
        user = self.request.user
        
        if not user.is_authenticated:
            raise PermissionDenied("User is not authenticated.")
        
        # If the user is an instructor, return all submissions
        if user.role == "instructor":  # Direct check for 'instructor' role
            return AssignmentSubmission.objects.all()  # Instructors see all submissions
        
        # Otherwise, students can only see their own submissions
        return AssignmentSubmission.objects.filter(student=user)
    
    def perform_create(self, serializer):
        """
        Instructors cannot submit assignments. This is overridden to prevent creating submissions.
        """
        user = self.request.user
        
        # Ensure that instructors cannot create submissions
        if user.role == "instructor":  # Direct check for 'instructor' role
            raise PermissionDenied("Instructors cannot submit assignments.")
        
        # Allow students to submit their assignments as usual
        serializer.save(student=user)

class AssignmentDetailView(APIView):
    def get(self, request, assignment_id, *args, **kwargs):
        try:
            # Fetch the assignment by its ID
            assignment = Assignment.objects.get(id=assignment_id)

            # Fetch all the students assigned to this assignment via the through model AssignmentStudent
            assigned_students = assignment.assigned_to.all()

            # Search for submissions related to this assignment in the AssignmentSubmission table
            submission_records = AssignmentSubmission.objects.filter(assignment=assignment)

            # Prepare a list to hold submissions details
            submissions_data = []

            # Filter submissions by course and track and compare with the assigned students
            for student in assigned_students:
                # Fetch the AssignmentStudent record for each student
                assignment_student = AssignmentStudent.objects.filter(
                    assignment=assignment,
                    student=student
                ).first()

                if assignment_student:
                    # Get the course and track for this student
                    course = assignment_student.course
                    track = assignment_student.track

                    # Check if the student has submitted the assignment for the correct course and track
                    submission = submission_records.filter(
                        student=student,
                        course=course,  # Ensure the submission course matches
                        track=track  # Ensure the submission track matches
                    ).first()

                    if submission:
                        # If submission exists, add the details
                        submissions_data.append({
                            "student": student.full_name,
                            "course": course.name,
                            "track": track.name,
                            "submission_time": submission.submission_date,  # Adjust field names accordingly
                            "file_url": submission.file_url,  # URL of the submission file
                            "status": "Submitted"
                        })
                    else:
                        # If no submission exists, indicate this
                        submissions_data.append({
                            "student": student.full_name,
                            "course": course.name,
                            "track": track.name,
                            "status": "Not Submitted"
                        })

            # Serialize the assignment data
            serialized_assignment = AssignmentDetailSerializer(assignment)

            # Combine the assignment details with submission data
            response_data = {
                "assignment": serialized_assignment.data,
                "submissions": submissions_data
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Assignment.DoesNotExist:
            return Response({"error": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
