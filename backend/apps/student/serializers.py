from rest_framework import serializers
from .models import Student
import openpyxl
from django.core.mail import send_mail
from django.conf import settings
import secrets
import string
import re
import logging

logger = logging.getLogger(__name__)

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'email', 'role', 'verified']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
            'role': {'required': False, 'default': 'Student'}
        }

    def validate_first_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("First name cannot be empty")
        if len(value) > 50:
            raise serializers.ValidationError("First name cannot exceed 50 characters")
        if not re.match(r'^[a-zA-Z\s\-]+$', value):
            raise serializers.ValidationError("First name can only contain letters, spaces, and hyphens")
        return value

    def validate_last_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Last name cannot be empty")
        if len(value) > 50:
            raise serializers.ValidationError("Last name cannot exceed 50 characters")
        if not re.match(r'^[a-zA-Z\s\-]+$', value):
            raise serializers.ValidationError("Last name can only contain letters, spaces, and hyphens")
        return value

    def validate_email(self, value):
        if not value.strip():
            raise serializers.ValidationError("Email cannot be empty")
        if Student.objects.filter(email=value).exists():
            raise serializers.ValidationError("A student with this email already exists")
        if len(value) > 100:
            raise serializers.ValidationError("Email cannot exceed 100 characters")
        if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', value):
            raise serializers.ValidationError("Enter a valid email address")
        return value

class ExcelUploadSerializer(serializers.Serializer):
    excel_file = serializers.FileField()

    def validate_excel_file(self, value):
        if not value.name.endswith(('.xlsx', '.xls', '.csv')):
            raise serializers.ValidationError("Only Excel files (.xlsx, .xls) or CSV files are allowed")
        if value.size > 5 * 1024 * 1024:  # 5MB limit
            raise serializers.ValidationError("File size cannot exceed 5MB")
        return value

    def process_excel(self):
        excel_file = self.validated_data['excel_file']
        wb = openpyxl.load_workbook(excel_file)
        sheet = wb.active
        students = []
        errors = []
        
        for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            try:
                if len(row) < 3:
                    errors.append(f"Row {row_idx}: Missing required fields")
                    continue
                    
                data = {
                    'first_name': str(row[0]).strip(),
                    'last_name': str(row[1]).strip(),
                    'email': str(row[2]).strip().lower(),
                    'role': str(row[3]).strip() if len(row) > 3 else 'Student'
                }
                
                serializer = StudentSerializer(data=data)
                if not serializer.is_valid():
                    errors.append(f"Row {row_idx}: {', '.join([f'{k}: {v[0]}' for k, v in serializer.errors.items()])}")
                    continue
                
                password = self._generate_password()
                verification_code = self._generate_verification_code()
                
                student = serializer.save(
                    verification_code=verification_code,
                    verified=False
                )
                student.set_password(password)
                students.append(student)
                
                try:
                    self._send_verification_email(student, password)
                except Exception as e:
                    errors.append(f"Row {row_idx}: Failed to send email - {str(e)}")
                    logger.error(f"Email failed for row {row_idx}: {str(e)}")
                    
            except Exception as e:
                errors.append(f"Row {row_idx}: Error processing - {str(e)}")
                logger.error(f"Error processing row {row_idx}: {str(e)}")
                continue
        
        if errors:
            logger.warning(f"Excel import completed with {len(errors)} errors")
        
        return {
            'created': len(Student.objects.bulk_create(students)),
            'errors': errors
        }

    def _generate_password(self):
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(chars) for _ in range(12))

    def _generate_verification_code(self):
        return secrets.token_urlsafe(24)

    def _send_verification_email(self, student, password):
        verification_url = f"{settings.SITE_URL}/api/student/verify/{student.verification_code}/"
        subject = f"Your {student.role} Account Verification"
        message = f"""Hello {student.first_name} {student.last_name},
        
Your {student.role} account has been created:
Email: {student.email}
Temporary Password: {password}

Please verify your email by clicking:
{verification_url}"""
        send_mail(
            subject,
            message.strip(),
            settings.DEFAULT_FROM_EMAIL,
            [student.email],
            fail_silently=False
        )