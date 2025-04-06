from rest_framework import serializers
from .models import Student
import openpyxl
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.exceptions import ValidationError
import secrets
import string
import re
import logging
from apps.tracks.models import Track


logger = logging.getLogger(__name__)

class ExcelUploadSerializer(serializers.Serializer):
    excel_file = serializers.FileField()
    track_id = serializers.IntegerField(required=False, allow_null=True)

    def process_excel(self):
        """Processes the uploaded Excel file and creates Student accounts."""
        excel_file = self.validated_data['excel_file']
        track_id = self.validated_data.get('track_id')

        logger.info(f"Received track_id: {track_id}")

        track = Track.objects.filter(id=track_id).first() if track_id else None
        if track_id and not track:
            logger.error(f"Track with ID {track_id} does not exist.")
            raise ValidationError(f"Track with ID {track_id} does not exist.")
        
        logger.info(f"Assigned track: {track.name if track else 'None'}")

        try:
            wb = openpyxl.load_workbook(excel_file)
            sheet = wb.active
        except Exception as e:
            logger.error(f"Failed to open the Excel file: {e}")
            raise ValidationError("Failed to open the Excel file.")
        
        students = []
        existing_emails = set(Student.objects.values_list('email', flat=True))
        errors = []
        created_count = 0

        for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            try:
                if len(row) < 3:  # At least first_name, last_name, email
                    errors.append(f"Row {row_idx}: Missing required fields")
                    continue

                first_name, last_name, email = row[:3]
                role = row[3] if len(row) > 3 else 'student'

                if not email or email in existing_emails:
                    errors.append(f"Row {row_idx}: Skipping existing or invalid email: {email}")
                    continue

                password = self._generate_password()
                verification_code = secrets.token_urlsafe(24)

                student = Student(
                    username=email.split('@')[0],
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    role=role,
                    track=track,
                    verification_code=verification_code,
                    verified=False
                )
                student.set_password(password)
                students.append(student)
                existing_emails.add(email)

            except Exception as e:
                errors.append(f"Row {row_idx}: Error - {str(e)}")
                logger.error(f"Error processing row {row_idx}: {str(e)}")

        try:
            created_students = Student.objects.bulk_create(students)
            created_count = len(created_students)
            
            for student in created_students:
                self.send_verification_email(student, password)

        except Exception as e:
            logger.error(f"Error during bulk_create: {str(e)}")
            raise ValidationError(f"Error creating students: {str(e)}")

        return {
            'created': created_count,
            'errors': errors
        }

    def _generate_password(self):
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(chars) for _ in range(12))

    def send_verification_email(self, student, password):
        try:
            verification_url = f"{settings.SITE_URL}/api/student/verify/{student.verification_code}/"
            subject = f"Your {student.role} Account Verification"
            message = f"""
            Hello {student.first_name},
            
            Your {student.role} account has been created:
            Email: {student.email}
            Temporary Password: {password}
            
            Please verify your email by clicking:
            {verification_url}
            """
            send_mail(
                subject,
                message.strip(),
                settings.DEFAULT_FROM_EMAIL,
                [student.email],
                fail_silently=False
            )
            logger.info(f"Verification email sent to {student.email}")
        except Exception as e:
            logger.error(f"Failed to send email to {student.email}: {str(e)}")
            raise
class StudentSerializer(serializers.ModelSerializer):
    track = serializers.SerializerMethodField()
    track_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    password = serializers.CharField(write_only=True, required=False)
    verification_code = serializers.CharField(read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'email', 
            'role', 'track', 'track_id', 'password',
            'verification_code', 'verified'
        ]
        extra_kwargs = {
            'verified': {'read_only': True},
        }

    def get_track(self, obj):
        return obj.track.name if obj.track else None

    def create(self, validated_data):
        track_id = validated_data.pop('track_id', None)
        password = validated_data.pop('password', None)
        
        # Handle track assignment
        if track_id:
            try:
                validated_data['track'] = Track.objects.get(id=track_id)
            except Track.DoesNotExist:
                raise serializers.ValidationError(
                    {'track_id': 'Invalid track ID'}
                )

        # Generate password if not provided
        if not password:
            password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        
        # Generate verification code
        verification_code = secrets.token_urlsafe(24)
        
        # Create student
        student = Student(
            **validated_data,
            verification_code=verification_code,
            verified=False
        )
        student.set_password(password)
        student.save()

        # Send verification email
        try:
            verification_url = f"{settings.SITE_URL}/api/student/verify/{verification_code}/"
            send_mail(
                f"Your {student.role} Account Verification",
                f"""Hello {student.first_name},
                
Your account has been created:
Email: {student.email}
Temporary Password: {password}

Please verify your email by visiting:
{verification_url}""",
                settings.DEFAULT_FROM_EMAIL,
                [student.email],
                fail_silently=False
            )
        except Exception as e:
            logger.error(f"Failed to send verification email: {str(e)}")
            # Don't fail the whole operation if email fails

        return student
