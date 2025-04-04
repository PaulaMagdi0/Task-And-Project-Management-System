from rest_framework import serializers
from apps.student.models import Student
from apps.tracks.models import Track
import openpyxl
from django.core.mail import send_mail
from django.conf import settings
import secrets
import string
from django.core.exceptions import ValidationError
import logging
from django.db import transaction

logger = logging.getLogger(__name__)

class ExcelUploadSerializer(serializers.Serializer):
    excel_file = serializers.FileField()
    track_id = serializers.PrimaryKeyRelatedField(
        queryset=Track.objects.all(),
        required=False,
        allow_null=True,
        source='track'
    )

    class Meta:
        fields = ['excel_file', 'track_id']

    def validate_excel_file(self, value):
        """Validate the uploaded Excel file."""
        if not value.name.endswith(('.xlsx', '.xls')):
            raise ValidationError("Only Excel files (.xlsx, .xls) are allowed")
        return value

    def save(self, **kwargs):
        """Process the Excel file and create student accounts."""
        try:
            return self._process_excel_file()
        except Exception as e:
            logger.exception("Error processing Excel file")
            raise ValidationError(f"Error processing Excel file: {str(e)}")

    def _process_excel_file(self):
        """Internal method to process the Excel file."""
        excel_file = self.validated_data['excel_file']
        track = self.validated_data.get('track')

        try:
            wb = openpyxl.load_workbook(excel_file)
            sheet = wb.active
        except Exception as e:
            logger.error(f"Failed to open Excel file: {str(e)}")
            raise ValidationError("Invalid Excel file format")

        students_to_create = []
        existing_emails = set(Student.objects.values_list('email', flat=True))
        created_students = []

        for row_num, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            try:
                if len(row) < 4:
                    logger.warning(f"Row {row_num}: Insufficient data")
                    continue

                first_name, last_name, email, role = row[:4]
                email = (email or "").strip().lower()

                if not all([first_name, last_name, email]):
                    logger.warning(f"Row {row_num}: Missing required fields")
                    continue

                if not self._validate_email(email):
                    logger.warning(f"Row {row_num}: Invalid email format")
                    continue

                if email in existing_emails:
                    logger.warning(f"Row {row_num}: Email already exists")
                    continue

                password = self._generate_password()
                verification_code = self._generate_verification_code()

                student = Student(
                    username=self._generate_username(email),
                    first_name=first_name.strip(),
                    last_name=last_name.strip(),
                    email=email,
                    role=(role or 'student').strip().lower(),
                    track=track,
                    verification_code=verification_code,
                    verified=False,
                    raw_password=password  # Temporary storage for email
                )
                student.set_password(password)
                students_to_create.append(student)
                existing_emails.add(email)

            except Exception as e:
                logger.error(f"Row {row_num}: Error processing - {str(e)}")
                continue

        with transaction.atomic():
            created_students = Student.objects.bulk_create(students_to_create)
            self._send_verification_emails(created_students)

        return {
            "status": "success",
            "created_count": len(created_students),
            "students": StudentSerializer(created_students, many=True).data
        }

    def _validate_email(self, email):
        """Validate email format."""
        from django.core.validators import validate_email
        try:
            validate_email(email)
            return True
        except ValidationError:
            return False

    def _generate_password(self):
        """Generate a secure random password."""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(12))

    def _generate_verification_code(self):
        """Generate a secure verification code."""
        return secrets.token_urlsafe(32)

    def _generate_username(self, email):
        """Generate username from email."""
        return email.split('@')[0]

    def _send_verification_emails(self, students):
        """Send verification emails to created students."""
        for student in students:
            try:
                self._send_single_verification_email(student)
            except Exception as e:
                logger.error(f"Failed to send email to {student.email}: {str(e)}")

    def _send_single_verification_email(self, student):
        """Send verification email to a single student."""
        verification_url = f"{settings.SITE_URL}/verify/{student.verification_code}/"
        
        subject = "Your Student Account Details"
        message = f"""
        Hello {student.first_name},
        
        Your student account has been created:
        Email: {student.email}
        Temporary Password: {student.raw_password}
        
        Please verify your email by visiting:
        {verification_url}
        
        After verification, you can login and change your password.
        """
        
        send_mail(
            subject,
            message.strip(),
            settings.DEFAULT_FROM_EMAIL,
            [student.email],
            fail_silently=False
        )
        logger.info(f"Verification email sent to {student.email}")


class StudentSerializer(serializers.ModelSerializer):
    track = serializers.StringRelatedField(read_only=True)
    track_id = serializers.PrimaryKeyRelatedField(
        queryset=Track.objects.all(),
        write_only=True,
        required=False,
        source='track'
    )
    password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'}
    )

    class Meta:
        model = Student
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'track', 'track_id', 'password', 'is_active',
            'verified', 'date_joined'
        ]
        read_only_fields = [
            'id', 'username', 'is_active', 'verified', 'date_joined'
        ]
        extra_kwargs = {
            'email': {'required': True}
        }

    def validate_email(self, value):
        """Validate email uniqueness."""
        if self.instance and self.instance.email == value:
            return value
            
        if Student.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def create(self, validated_data):
        """Create a new student account."""
        password = validated_data.pop('password', None)
        track = validated_data.get('track')

        student = Student(**validated_data)
        
        if password:
            student.set_password(password)
        else:
            student.set_password(self._generate_temp_password())

        student.verification_code = self._generate_verification_code()
        student.save()

        self._send_verification_email(student, password)
        return student

    def update(self, instance, validated_data):
        """Update student information."""
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        instance.save()
        return instance

    def _generate_temp_password(self):
        """Generate temporary password."""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(10))

    def _generate_verification_code(self):
        """Generate verification code."""
        return secrets.token_urlsafe(32)

    def _send_verification_email(self, student, password):
        """Send verification email."""
        try:
            verification_url = f"{settings.SITE_URL}/verify/{student.verification_code}/"
            
            subject = "Verify Your Student Account"
            message = f"""
            Hello {student.first_name},
            
            Please verify your email by visiting:
            {verification_url}
            
            Your temporary password: {password}
            """
            
            send_mail(
                subject,
                message.strip(),
                settings.DEFAULT_FROM_EMAIL,
                [student.email],
                fail_silently=False
            )
        except Exception as e:
            logger.error(f"Failed to send verification email: {str(e)}")