from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .serializers import ExcelUploadSerializer, StudentSerializer
from apps.student.models import Student
import logging
from django.shortcuts import get_object_or_404
from django.http import JsonResponse

logger = logging.getLogger(__name__)

@api_view(['POST'])
def upload_excel(request):
    """Handle the upload of an Excel file and process its data."""
    if 'excel_file' not in request.FILES:
        return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

    serializer = ExcelUploadSerializer(data=request.data)

    if serializer.is_valid():
        result = serializer.save_users_from_excel()
        students = result.get("users", [])  # ✅ Extract list of students safely
        student_serializer = StudentSerializer(students, many=True)  

        return Response({
            "message": f"{len(students)} users created and verification emails sent.",
            "users": student_serializer.data
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def list_students(request):
    """Retrieve and return a list of all students."""
    students = Student.objects.all()  
    serializer = StudentSerializer(students, many=True)
    
    if not students.exists():
        return Response({"message": "No students found."}, status=status.HTTP_204_NO_CONTENT)
    
    return Response(serializer.data, status=status.HTTP_200_OK)

def verify_email(request, verification_code):
    """Verifies the student's email using the verification code."""
    student = get_object_or_404(Student, verification_code=verification_code)

    if student.verified:
        return JsonResponse({'message': 'Email already verified '}, status=400)

    student.verified = True
    student.verification_code = None  # Remove the code after use
    student.save()

    return JsonResponse({'message': 'Email verified successfully'})
