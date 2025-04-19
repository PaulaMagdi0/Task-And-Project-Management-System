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

class AssignmentStudentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsInstructor]

    def get_assignment_submission(self, assignment_id, student_id):
        assignment = get_object_or_404(Assignment, id=assignment_id)
        student = get_object_or_404(Student, id=student_id)

        assignment_student = AssignmentStudent.objects.filter(
            assignment=assignment,
            student=student
        ).first()

        if not assignment_student:
            raise ValidationError("Student was not assigned this assignment.")

        course = assignment_student.course
        track = assignment_student.track

        submission = AssignmentSubmission.objects.filter(
            assignment=assignment,
            student=student,
            course=course,
            track=track
        ).first()

        return assignment, student, submission, course, track

    def get(self, request, assignment_id, student_id):
        try:
            assignment, student, submission, course, track = self.get_assignment_submission(assignment_id, student_id)

            submission_data = {
                "student": student.full_name,
                "course": course.name,
                "track": track.name,
                "status": "Submitted" if submission else "Not Submitted"
            }

            if submission:
                submission_data.update({
                    "submission_time": submission.submission_date,
                    "file_url": submission.file_url,
                    "feedback": submission.feedback,
                    "score": submission.score
                })

            assignment_data = AssignmentDetailSerializer(assignment).data

            return Response({
                "assignment": assignment_data,
                "submission": submission_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def post(self, request, assignment_id, student_id):
        return self._update_feedback(request, assignment_id, student_id, create_only=True)

    def put(self, request, assignment_id, student_id):
        return self._update_feedback(request, assignment_id, student_id)

    def patch(self, request, assignment_id, student_id):
        return self._update_feedback(request, assignment_id, student_id)

    def delete(self, request, assignment_id, student_id):
        try:
            _, _, submission, _, _ = self.get_assignment_submission(assignment_id, student_id)

            if not submission:
                return Response({"error": "Submission not found."}, status=404)

            # Clear only feedback and score
            submission.feedback = None
            submission.score = None
            submission.save()

            return Response({"message": "Feedback and score removed successfully."}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=400)


    def _update_feedback(self, request, assignment_id, student_id, create_only=False):
        try:
            _, _, submission, _, _ = self.get_assignment_submission(assignment_id, student_id)

            if not submission:
                return Response({"error": "Submission not found."}, status=404)

            if create_only and (submission.feedback or submission.score):
                return Response({"error": "Feedback already exists. Use PUT/PATCH to update."}, status=400)

            feedback = request.data.get("feedback", submission.feedback)
            score = request.data.get("score", submission.score)

            if score is not None:
                try:
                    score = float(score)
                    if not (0 <= score <= 100):
                        return Response({"error": "Score must be between 0 and 100."}, status=400)
                except ValueError:
                    return Response({"error": "Score must be a number."}, status=400)

            submission.feedback = feedback
            submission.score = score
            submission.save()

            return Response({
                "message": "Feedback and score saved successfully.",
                "feedback": submission.feedback,
                "score": submission.score
            }, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=400)
