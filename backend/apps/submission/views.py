from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import AssignmentSubmission
from apps.staff_members.permissions import IsInstructor  # Assuming this is in permissions.py
import logging

# Define a logger instance
logger = logging.getLogger(__name__)
import os
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse
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
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from io import BytesIO
from rest_framework.views import APIView
from .serializers import AssignmentSubmissionSerializer,AssignmentDetailSerializer
from apps.submission.models import AssignmentSubmission
from rest_framework.permissions import IsAuthenticated
from apps.staff_members.permissions import IsInstructor
from apps.grades.models import Grade

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
        # Safer fetching using get_object_or_404
        assignment = get_object_or_404(Assignment, id=assignment_id)
        student = get_object_or_404(Student, id=student_id)

        course = assignment.course
        track = student.track

        # Get the first matching submission
        submission = student.submissions.filter(assignment_id=assignment_id).first()

        return assignment, student, submission, course, track

    def get(self, request, assignment_id, student_id):
        try:
            assignment, student, submission, course, track = self.get_assignment_submission(assignment_id, student_id)

            # Get the grade if it exists
            grade = Grade.objects.filter(assignment=assignment, student=student).first()

            submission_data = {
                "student": student.full_name,
                "course": course.name,
                "track": track.name,
                "status": "Submitted" if submission else "Not Submitted",
            }

            if submission:
                submission_data.update({
                    "submission_time": submission.submission_date,
                    "file_url": submission.file_url,
                })

            if grade:
                submission_data.update({
                    "feedback": grade.feedback or "No feedback",
                    "score": grade.score,
                    "graded_date": grade.graded_date,
                })

            assignment_data = AssignmentDetailSerializer(assignment).data

            return Response({
                "assignment": assignment_data,
                "submission": submission_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
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

class AssignmentReportView(APIView):
    permission_classes = [IsAuthenticated, IsInstructor]
g
    # def get(self, request, pk, format=None):
    #     try:
    #         # Fetch assignment with related data
    #         assignment = Assignment.objects.prefetch_related(
    #             'assignmentstudent_set__student',
    #             'assignmentstudent_set__course',
    #             'assignmentstudent_set__track'
    #         ).get(id=pk)

    #         # Get all related submissions
    #         submissions = AssignmentSubmission.objects.filter(
    #             assignment=assignment
    #         ).select_related('student')

    #         # Create PDF buffer
    #         buffer = BytesIO()
    #         doc = SimpleDocTemplate(buffer, pagesize=letter)
    #         styles = getSampleStyleSheet()
    #         elements = []

    #         # --- Title Section ---
    #         elements.append(Paragraph(f"Assignment Report: {assignment.title}", styles['Title']))
    #         elements.append(Spacer(1, 12))

    #         # --- Assignment Details Table ---
    #         assignment_data = [
    #             ['Title:', assignment.title],
    #             ['Course:', assignment.course.name if assignment.course else "N/A"],
    #             ['Due Date:', assignment.due_date.strftime("%Y-%m-%d %H:%M")],
    #             ['End Date:', assignment.end_date.strftime("%Y-%m-%d %H:%M")],
    #             ['Type:', assignment.get_assignment_type_display()],
    #         ]
    #         assignment_table = Table(assignment_data, colWidths=[100, 400])
    #         assignment_table.setStyle(TableStyle([
    #             ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
    #             ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    #             ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    #         ]))

    #         elements.append(assignment_table)
    #         elements.append(Spacer(1, 24))

    #         # --- Student Submissions Table ---
    #         student_data = [['Student', 'Track', 'Course', 'Status', 'Score', 'Feedback']]
    #         for as_student in sorted(assignment.assignmentstudent_set.all(), key=lambda s: s.student.full_name):
    #             submission = submissions.filter(student=as_student.student).first()
    #             student_data.append([
    #                 as_student.student.full_name,
    #                 as_student.track.name if as_student.track else "N/A",
    #                 assignment.course.name if assignment.course else "N/A",
    #                 "Submitted" if submission else "Not Submitted",
    #                 str(submission.score) if submission and submission.score is not None else "N/A",
    #                 Paragraph(submission.feedback, styles['Normal']) if submission and submission.feedback else "N/A"
    #             ])

    #         student_table = Table(student_data,
    #                               colWidths=[120, 100, 80, 80, 60, 120],
    #                               repeatRows=1)
    #         student_table.setStyle(TableStyle([
    #             ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4472C4')),
    #             ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    #             ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    #             ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    #             ('FONTSIZE', (0, 0), (-1, 0), 10),
    #             ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    #             ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#D9E1F2')),
    #             ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#5B9BD5')),
    #         ]))

    #         elements.append(student_table)
    #         elements.append(Spacer(1, 12))

    #         # --- Build PDF ---
    #         doc.build(elements)
    #         buffer.seek(0)

    #         # --- Return PDF Response ---
    #         response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    #         response['Content-Disposition'] = f'attachment; filename="assignment_{pk}_report.pdf"'
    #         return response

    #     except Assignment.DoesNotExist:
    #         return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)
    #     except Exception as e:
    #         logger.error(f"Error generating report: {str(e)}", exc_info=True)
    #         return Response(
    #             {"error": "Failed to generate report. Please try again later."},
    #             status=status.HTTP_500_INTERNAL_SERVER_ERROR
    #         )

class SubmissionByStudentAssignmentView(generics.ListAPIView):
    serializer_class = AssignmentSubmissionSerializer

    def get_queryset(self):
        student_id = self.request.query_params.get('student')
        assignment_id = self.request.query_params.get('assignment')

        if not student_id or not assignment_id:
            logger.warning("Missing student or assignment query parameter.")
            return AssignmentSubmission.objects.none()

        logger.debug(f"Filtering submissions for student={student_id}, assignment={assignment_id}")
        return AssignmentSubmission.objects.filter(student_id=student_id, assignment_id=assignment_id)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        if not queryset.exists():
            logger.info(f"No submission found for student={request.query_params.get('student')} and assignment={request.query_params.get('assignment')}")
            return Response(
                {"detail": "Submission not found for this student and assignment."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
