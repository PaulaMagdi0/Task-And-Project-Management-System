from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import ExcelUploadSerializer, StudentSerializer
from apps.student.models import Student
import logging
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.db import transaction

logger = logging.getLogger(__name__)

@api_view(['POST'])
# @permission_classes([IsAuthenticated])
@permission_classes([AllowAny])
def upload_excel(request):
    """Handle bulk student creation via Excel upload"""
    try:
        if 'excel_file' not in request.FILES:
            logger.warning("No file uploaded in request")
            return Response(
                {"error": "Excel file is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ExcelUploadSerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            logger.error(f"Excel validation errors: {serializer.errors}")
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            result = serializer.save()
            students = result.get("created_students", [])
            
            if not students:
                return Response(
                    {"message": "No new students created"},
                    status=status.HTTP_200_OK
                )

            student_serializer = StudentSerializer(students, many=True)
            logger.info(f"Created {len(students)} new students via Excel upload")

            return Response({
                "status": "success",
                "created_count": len(students),
                "students": student_serializer.data
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception("Error during Excel upload processing")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
# @permission_classes([IsAuthenticated])
@permission_classes([AllowAny])

def list_students(request):
    """List all students with optional filtering"""
    try:
        students = Student.objects.all().select_related('department')
        
        # Example filtering - customize as needed
        if department_id := request.query_params.get('department'):
            students = students.filter(department_id=department_id)
        
        if not students.exists():
            return Response(
                {"message": "No students found"},
                status=status.HTTP_204_NO_CONTENT
            )

        serializer = StudentSerializer(students, many=True)
        return Response({
            "count": students.count(),
            "students": serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error listing students: {str(e)}")
        return Response(
            {"error": "Failed to retrieve students"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, verification_code):
    """Verify student email using verification code"""
    try:
        student = get_object_or_404(Student, verification_code=verification_code)
        
        if student.verified:
            logger.info(f"Student {student.id} already verified")
            return JsonResponse(
                {'status': 'already_verified', 'message': 'Email already verified'},
                status=status.HTTP_200_OK
            )

        student.verified = True
        student.verification_code = None
        student.save()
        
        logger.info(f"Verified email for student {student.id}")
        return JsonResponse(
            {'status': 'success', 'message': 'Email verified successfully'},
            status=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(f"Email verification failed: {str(e)}")
        return JsonResponse(
            {'status': 'error', 'message': 'Verification failed'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['PATCH'])
# @permission_classes([IsAuthenticated])
@permission_classes([AllowAny])

def update_student(request, student_id):
    """Update student information"""
    try:
        student = get_object_or_404(Student, id=student_id)
        serializer = StudentSerializer(
            student, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()
        logger.info(f"Updated student {student_id}")
        return Response({
            "status": "success",
            "student": serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error updating student {student_id}: {str(e)}")
        return Response(
            {"error": "Failed to update student"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
# @permission_classes([IsAuthenticated])
@permission_classes([AllowAny])

def delete_student(request, student_id):
    """Delete a student record"""
    try:
        student = get_object_or_404(Student, id=student_id)
        student.delete()
        logger.info(f"Deleted student {student_id}")
        return Response(
            {"status": "success", "message": "Student deleted"},
            status=status.HTTP_204_NO_CONTENT
        )
    except Exception as e:
        logger.error(f"Error deleting student {student_id}: {str(e)}")
        return Response(
            {"error": "Failed to delete student"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )