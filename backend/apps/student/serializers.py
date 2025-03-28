from rest_framework import serializers
from apps.student.models import Student  
import openpyxl
from django.core.mail import send_mail
from django.conf import settings
import secrets
import string
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)
class ExcelUploadSerializer(serializers.Serializer):
    excel_file = serializers.FileField()

    def save_users_from_excel(self):
        """Processes the uploaded Excel file and creates Student accounts."""
        excel_file = self.validated_data['excel_file']
        wb = openpyxl.load_workbook(excel_file)
        sheet = wb.active

        students = []
        existing_emails = set(Student.objects.values_list('email', flat=True))
        created_students = []

        for row in sheet.iter_rows(min_row=2, values_only=True):  
            first_name, last_name, email, role = row
            if not email or email in existing_emails:
                continue  

            role = role if role else 'student'
            password = self.generate_random_password()  # Generate password

            student = Student(
                username=email.split('@')[0],  
                first_name=first_name,
                last_name=last_name,
                email=email,
                role=role
            )
            student.set_password(password)  
            student.raw_password = password  # Temporarily store for email
            students.append(student)

        try:
            created_students = Student.objects.bulk_create(students)
            for student in created_students:
                self.send_verification_email(student, student.raw_password)
        except Exception as e:
            logger.error(f"Error creating students: {e}")
            raise ValidationError("An error occurred while creating students.")

        return {
            "message": f"{len(created_students)} students created successfully.",
            "users": StudentSerializer(created_students, many=True).data
        }

    def generate_random_password(self):
        """Generates a secure random password."""
        length = 12  
        characters = string.ascii_letters + string.digits + "!@#$%^&*()"
        return ''.join(secrets.choice(characters) for _ in range(length))

    def send_verification_email(self, student, password):
        try:
            verification_code = self.generate_verification_code()
            student.verification_code = verification_code
            student.verified = False  
            student.save()

            verification_url = f"{settings.SITE_URL}/api/student/verify/{verification_code}/"

            subject = 'Your ITI Student Account - Verify Email & Login Credentials'
            message = (
                f"Hello {student.first_name},\n\n"
                f"Your ITI student account has been created.\n"
                f"Here are your login credentials:\n"
                f"📧 Email: {student.email}\n"
                f"🔑 Temporary Password: {password}\n\n"
                f"Before you can log in, please verify your email by clicking the link below:\n"
                f"{verification_url}\n\n"
                f"Best regards,\nITI Admin Team"
            )
            
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [student.email])

            print(f"✅ Verification email sent to {student.email}")  # Debugging
            logger.info(f"✅ Verification email sent to {student.email}")

        except Exception as e:
            logger.error(f"❌ Error sending verification email to {student.email}: {e}")
            print(f"❌ Error: {e}")  # Debugging

    def generate_verification_code(self):
        """Generates a secure verification code within 32 characters."""
        return secrets.token_urlsafe(24)  # Generates a code that fits within 32 characters

class StudentSerializer(serializers.ModelSerializer):
    """Serializes Student data including verification status."""
    
    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'email', 'role', 'verified']