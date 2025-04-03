from rest_framework import serializers
from .models import Student
import openpyxl
from django.core.mail import send_mail
from django.conf import settings
import secrets
import string
import re
import logging
from apps.tracks.models import Track


logger = logging.getLogger(__name__)

class ExcelUploadSerializer(serializers.Serializer):
    excel_file = serializers.FileField()
    track_id = serializers.IntegerField(required=False, allow_null=True)

    def save_users_from_excel(self):
        """Processes the uploaded Excel file and creates Student accounts."""
        
        # Extract the Excel file and track_id from the validated data
        excel_file = self.validated_data['excel_file']
        track_id = self.validated_data.get('track_id')

        logger.info(f"Received track_id: {track_id}")

        # Retrieve the track if the track_id is provided, or assign None if not
        track = Track.objects.filter(id=track_id).first() if track_id else None
        if track_id and not track:
            logger.error(f"Track with ID {track_id} does not exist.")
            raise ValidationError(f"Track with ID {track_id} does not exist.")
        
        logger.info(f"Assigned track: {track.name if track else 'None'}")

        # Open the Excel file using openpyxl
        try:
            wb = openpyxl.load_workbook(excel_file)
            sheet = wb.active
        except Exception as e:
            logger.error(f"Failed to open the Excel file: {e}")
            raise ValidationError("Failed to open the Excel file.")
        
        students = []  # List to hold student objects to be created
        existing_emails = set(Student.objects.values_list('email', flat=True))  # Set of existing emails
        created_students = []  # List to hold created students

        # Iterate over rows in the sheet, starting from row 2 (to skip the header)
        for row in sheet.iter_rows(min_row=2, values_only=True):
            first_name, last_name, email, role = row

            logger.info(f"Processing student: {first_name} {last_name}, email: {email}")

            # Skip if email is missing or already exists in the database
            if not email or email in existing_emails:
                logger.warning(f"Skipping existing or invalid email: {email}")
                continue

            # Default role to 'student' if not provided in the Excel
            role = role if role else 'student'

            # Generate random password for the new student
            password = self.generate_random_password()

            # Create the student object
            student = Student(
                username=email.split('@')[0],  # Use part of email as username
                first_name=first_name,
                last_name=last_name,
                email=email,
                role=role,
                track=track  # Assign track to student
            )

            # Set password (make sure it is hashed)
            student.set_password(password)
            student.raw_password = password  # Store raw password temporarily for email
            students.append(student)

        try:
            # Create students in bulk (optimize database performance)
            created_students = Student.objects.select_related('track').bulk_create(students)

            # Send verification email for each created student
            for student in created_students:
                self.send_verification_email(student, student.raw_password)

        except Exception as e:
            logger.error(f"Error during bulk_create or email sending: {e}")
            logger.exception("Exception details:")
            raise ValidationError("An error occurred while creating students.")

        return {
            'created': len(Student.objects.bulk_create(students)),
            'errors': errors
        }

    def _generate_password(self):
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(chars) for _ in range(12))

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
    track = serializers.SerializerMethodField()
    track_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'email', 'role', 'track', 'track_id']

    def get_track(self, obj):
        """Returns the name of the track or None if no track is assigned."""
        if isinstance(obj, Student):
            # Directly access the track attribute and return its name if it exists
            return obj.track.name if obj.track else None
        return None

    def create(self, validated_data):
        """Override the create method to assign the correct Track to the student."""
        track_id = validated_data.get('track_id', None)

        # Debugging the track_id received
        print(f"Received track_id: {track_id}")

        if track_id:
            try:
                track = Track.objects.get(id=track_id)
                validated_data['track'] = track  # Assign the track to the student
                print(f"Assigned track: {track.name}")
            except Track.DoesNotExist:
                raise serializers.ValidationError(f"Track with ID {track_id} does not exist.")
        else:
            print("No track_id provided")

        student = Student(**validated_data)
        
        # Ensure password is set properly
        password = validated_data.get('password')
        if password:
            student.set_password(password)

        student.save()

        # Debugging the student's track after saving
        print(f"Assigned track after saving: {student.track.name if student.track else 'None'}")

        return student
