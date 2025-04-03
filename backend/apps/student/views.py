from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .serializers import ExcelUploadSerializer, StudentSerializer
from .models import Student
from django.conf import settings
from django.core.mail import send_mail
import secrets
import string
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def upload_student(request):
    # Excel file upload handling
    if 'excel_file' in request.FILES:
        serializer = ExcelUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid file upload',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            result = serializer.process_excel()
            response_data = {
                'success': True,
                'message': f"Successfully created {result['created']} students",
                'created': result['created']
            }
            if result.get('errors'):
                response_data['warning'] = f"{len(result['errors'])} rows had errors"
                response_data['error_count'] = len(result['errors'])
                if len(result['errors']) <= 10:
                    response_data['sample_errors'] = result['errors'][:5]
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Excel processing failed: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to process Excel file',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # Single student creation
    data = request.data.copy()
    data['role'] = data.get('role', 'student')  # Default role
    
    serializer = StudentSerializer(data=data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        student = serializer.save()
        return Response({
            'success': True,
            'message': 'Student created successfully. Verification email sent.',
            'student': StudentSerializer(student).data
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Student creation failed: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to create student',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def list_students(request):
    students = Student.objects.all()
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def show_options(request):
    options = {
        'upload_endpoint': '/api/student/upload/',
        'list_endpoint': '/api/student/list/',
        'verify_endpoint': '/api/student/verify/<str:verification_code>/'
    }
    return Response(options)

@api_view(['GET'])
def verify_email(request, verification_code):
    try:
        student = Student.objects.get(verification_code=verification_code)
        if student.verified:
            return Response({'status': 'Email already verified'}, status=status.HTTP_200_OK)
            
        student.verified = True
        student.verification_code = None
        student.save()
        
        return Response({'status': 'Email verified successfully'})
    except Student.DoesNotExist:
        return Response(
            {'error': 'Invalid verification code or link has expired'},
            status=status.HTTP_400_BAD_REQUEST
        )