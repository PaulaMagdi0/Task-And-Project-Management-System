from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
import logging
import os

from .models import Assignment
from .serializers import AssignmentSerializer
from apps.student.models import Student  # Make sure this import is at the top

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
