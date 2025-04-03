from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from .models import Assignment
from .serializers import AssignmentSerializer
# from .utils import upload_file_to_google_drive  # Your utility function to upload to Google Drive
from django.core.exceptions import ValidationError

class AssignmentListView(generics.ListCreateAPIView):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer

    def perform_create(self, serializer):
        # Check if the file is in the request
        file = self.request.FILES.get('file', None)

        if file:
            # Upload file to Google Drive and get the file URL
            try:
                file_url = upload_file_to_google_drive(file)  # Implement this function in utils.py
            except Exception as e:
                raise ValidationError(f"Error uploading file to Google Drive: {str(e)}")

            # Save the assignment with the file URL
            serializer.save(file=file_url)  # Save with Google Drive URL
        else:
            # Save assignment without a file if no file is provided
            serializer.save()

    def create(self, request, *args, **kwargs):
        """
        Override the create method to handle file upload before saving the assignment.
        """
        return super().create(request, *args, **kwargs)
