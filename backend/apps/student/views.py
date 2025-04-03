from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .serializers import ExcelUploadSerializer, StudentSerializer
from apps.student.models import Student
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def upload_student(request):
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
            if result['errors']:
                response_data['warning'] = f"{len(result['errors'])} rows had errors"
                response_data['error_count'] = len(result['errors'])
                if len(result['errors']) <= 10:  # Don't return too many errors
                    response_data['sample_errors'] = result['errors'][:5]
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Excel processing failed: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to process Excel file',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # Handle single student creation
    serializer = StudentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Create student with default role 'Student'
        student_data = serializer.validated_data
        if 'role' not in student_data:
            student_data['role'] = 'Student'
            
        password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        verification_code = secrets.token_urlsafe(24)
        
        student = serializer.save(
            verification_code=verification_code,
            verified=False
        )
        student.set_password(password)
        student.save()
        
        # Send verification email
        try:
            verification_url = f"{settings.SITE_URL}/api/student/verify/{verification_code}/"
            send_mail(
                f"Your {student.role} Account",
                f"""Hello {student.first_name},
                
Your account has been created:
Email: {student.email}
Temporary Password: {password}

Please verify: {verification_url}""",
                settings.DEFAULT_FROM_EMAIL,
                [student.email]
            )
        except Exception as e:
            logger.error(f"Email sending failed: {str(e)}")
        
        return Response({
            'success': True,
            'message': 'Student created successfully',
            'student': StudentSerializer(student).data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Student creation failed: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to create student',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ... (keep other views the same)
# ... (keep other views the same)
# @api_view(['POST'])
# def upload_excel(request):
#     """Handle the upload of an Excel file and process its data."""
#     if 'excel_file' not in request.FILES:
#         return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

#     serializer = ExcelUploadSerializer(data=request.data)

#     if serializer.is_valid():
#         result = serializer.save_users_from_excel()
#         students = result.get("users", [])  # ✅ Extract list of students safely
#         student_serializer = StudentSerializer(students, many=True)  

#         return Response({
#             "message": f"{len(students)} users created and verification emails sent.",
#             "users": student_serializer.data
#         }, status=status.HTTP_201_CREATED)

#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    # return Response(options, status=status.HTTP_200_OK)