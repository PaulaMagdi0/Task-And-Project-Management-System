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
from django.core.validators import validate_email
from io import BytesIO

logger = logging.getLogger(__name__)

class ExcelUploadSerializer(serializers.Serializer):
    excel_file = serializers.FileField()
    track_id = serializers.PrimaryKeyRelatedField(
        queryset=Track.objects.all(),
        required=False,
        allow_null=True,
        source='track'
    )
    def validate_excel_file(self, value):
        """Robust Excel validation without magic dependency"""
        try:
            # 1. Verify file extension first
            if not value.name.lower().endswith(('.xlsx', '.xls')):
                raise ValidationError("Only .xlsx or .xls files allowed")
            
            # 2. Verify file content by trying to read it
            try:
                # Read the file content into memory
                content = value.read()
                value.seek(0)  # Reset file pointer to the beginning
                
                # Try loading the workbook
                wb = openpyxl.load_workbook(filename=BytesIO(content))
                sheet = wb.active
            except Exception as e:
                logger.error(f"Excel read error: {str(e)}")
                raise ValidationError(f"Invalid Excel file: {str(e)}")
            
            # 3. Validate header row
            try:
                header_row = [str(cell.value).strip().lower() for cell in sheet[1]]
                required_columns = [
                    'first name', 
                    'last name', 
                    'email', 
                    'role'
                ]
                
                missing = [col for col in required_columns if col not in header_row]
                if missing:
                    raise ValidationError(
                        f"Missing columns: {', '.join(missing).title()}. "
                        f"Found columns: {', '.join(header_row)}"
                    )
            except IndexError:
                raise ValidationError("Excel file has no header row")
            
            # 4. Verify data exists
            if sheet.max_row < 2:  # At least 1 row of data after header
                raise ValidationError("Excel file contains no data rows")
            
            # Return the validated file
            return value
        
        except ValidationError:
            # Reraise validation errors
            raise
        except Exception as e:
            logger.exception("Excel validation failed")
            raise ValidationError("Invalid Excel file format")


    def _process_excel_file(self):
        try:
            # Code to process the Excel file and create student records...
            for row in sheet.iter_rows(min_row=2, max_row=sheet.max_row):
                # Assume that row contains the data: [first_name, last_name, email, role]
                first_name = row[0].value.strip()
                last_name = row[1].value.strip()
                email = row[2].value.strip()
                role = row[3].value.strip()

                # Create or save the student record
                student = Student(
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    role=role
                )
                student.save()  # This is where the error might occur

        except IntegrityError as e:
            logger.error(f"Integrity error while saving student: {str(e)}")
            raise ValidationError("Failed to create student records due to data integrity issues. Please check the values for any overly long fields.")
        except Exception as e:
            logger.error(f"Error processing Excel file: {str(e)}")
            raise ValidationError(f"Failed to create student records: {str(e)}")
            
    def _process_excel_file(self):
        """Process the validated Excel file with detailed error handling"""
        excel_file = self.validated_data['excel_file']
        track = self.validated_data.get('track')

        try:
            wb = openpyxl.load_workbook(excel_file)
            sheet = wb.active
            
            # Verify sheet is not empty
            if sheet.max_row < 2:  # 1 header row + at least 1 data row
                raise ValidationError("Excel file contains no data rows")

            students_to_create = []
            errors = []
            
            for row_num, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
                try:
                    if len(row) < 4:
                        raise ValidationError("Insufficient columns in row")
                        
                    first_name, last_name, email, role = row[:4]
                    
                    # Validate required fields
                    if not all([first_name, last_name, email]):
                        raise ValidationError("Missing required fields")
                        
                    # Process and validate the row data
                    student_data = {
                        'first_name': str(first_name).strip(),
                        'last_name': str(last_name).strip(),
                        'email': str(email).strip().lower(),
                        'role': (str(role).strip().lower() if role else 'student'),
                        'track': track
                    }
                    
                    # Validate with your StudentSerializer
                    student_serializer = StudentSerializer(data=student_data)
                    if not student_serializer.is_valid():
                        raise ValidationError(student_serializer.errors)
                        
                    students_to_create.append(student_serializer)
                    
                except ValidationError as e:
                    errors.append(f"Row {row_num}: {str(e)}")
                    logger.warning(f"Row {row_num} validation failed: {str(e)}")
                    continue

            if not students_to_create and errors:
                raise ValidationError({
                    'detail': 'All rows failed validation',
                    'errors': errors
                })

            # Create students in a transaction
            with transaction.atomic():
                created_students = []
                for serializer in students_to_create:
                    try:
                        student = serializer.save()
                        created_students.append(student)
                    except Exception as e:
                        errors.append(f"Failed to create student: {str(e)}")
                        raise  # This will rollback the transaction

            return {
                'status': 'partial_success' if errors else 'success',
                'created_count': len(created_students),
                'error_count': len(errors),
                'errors': errors,
                'students': StudentSerializer(created_students, many=True).data
            }

        except Exception as e:
            logger.exception(f"Excel processing failed: {str(e)}")
            raise ValidationError(f"Error processing Excel file: {str(e)}")

    def save(self, **kwargs):
        """Main entry point with proper error handling"""
        try:
            return self._process_excel_file()
        except ValidationError as e:
            raise  # Re-raise validation errors
        except Exception as e:
            logger.exception("Unexpected error during Excel processing")
            raise ValidationError("Failed to process Excel file")
        
    def _process_excel_file(self):
        """Process the Excel file and create student accounts."""
        excel_file = self.validated_data['excel_file']
        track = self.validated_data.get('track')

        try:
            wb = openpyxl.load_workbook(excel_file)
            sheet = wb.active
            
            # Validate header row
            header_row = next(sheet.iter_rows(min_row=1, max_row=1, values_only=True))
            required_columns = ['First Name', 'Last Name', 'Email', 'Role']
            if not all(col in header_row for col in required_columns):
                raise ValidationError(
                    f"Excel file missing required columns. Found: {header_row}, Required: {required_columns}"
                )
                
        except Exception as e:
            e.sheet = getattr(sheet, 'title', 'Unknown')
            logger.error(f"Failed to open Excel file: {str(e)}")
            raise ValidationError("Invalid Excel file format or structure")

        students_to_create = []
        existing_emails = set(Student.objects.values_list('email', flat=True))
        created_students = []
        email_password_map = {}
        errors = []

        for row_num, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            try:
                if len(row) < 4:
                    errors.append(f"Row {row_num}: Insufficient data (expected 4 columns, got {len(row)})")
                    continue

                first_name, last_name, email, role = row[:4]
                email = (email or "").strip().lower()

                # Validate required fields
                if not first_name:
                    errors.append(f"Row {row_num}: Missing first name")
                    continue
                if not last_name:
                    errors.append(f"Row {row_num}: Missing last name")
                    continue
                if not email:
                    errors.append(f"Row {row_num}: Missing email")
                    continue

                if not self._validate_email(email):
                    errors.append(f"Row {row_num}: Invalid email format '{email}'")
                    continue

                if email in existing_emails:
                    errors.append(f"Row {row_num}: Email '{email}' already exists")
                    continue

                password = self._generate_password()
                verification_code = self._generate_verification_code()

                student = Student(
                    username=self._generate_username(email),
                    first_name=str(first_name).strip(),
                    last_name=str(last_name).strip(),
                    email=email,
                    role=(str(role) if role else 'student').strip().lower(),
                    track=track,
                    verification_code=verification_code,
                    verified=False
                )
                student.set_password(password)
                students_to_create.append(student)
                existing_emails.add(email)
                email_password_map[email] = password

            except Exception as e:
                errors.append(f"Row {row_num}: Error processing - {str(e)}")
                logger.error(f"Row {row_num}: Error processing - {str(e)}")
                continue

        if errors and not students_to_create:
            raise ValidationError({
                'detail': 'All rows failed validation',
                'errors': errors
            })

        try:
            with transaction.atomic():
                created_students = Student.objects.bulk_create(students_to_create)
                self._send_verification_emails(created_students, email_password_map)
        except Exception as e:
            logger.error(f"Database error during bulk create: {str(e)}")
            raise ValidationError(f"Failed to create student records: {str(e)}")

        return {
            "status": "partial_success" if errors else "success",
            "created_count": len(created_students),
            "error_count": len(errors),
            "students": StudentSerializer(created_students, many=True).data,
            "errors": errors if errors else None
        }

    def _validate_email(self, email):
        """Validate email format."""
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
        return secrets.token_urlsafe(24)

    def _generate_username(self, email):
        """Generate username from email."""
        return email.split('@')[0]

    def _send_verification_emails(self, students, email_password_map):
        """Send verification emails to created students."""
        for student in students:
            try:
                password = email_password_map.get(student.email)
                if password:
                    verification_url = f"{settings.SITE_URL}api/student/verify/{student.verification_code}/"
                    
                    subject = "Your Student Account Details"
                    message = f"""
                    Hello {student.first_name},
                    
                    Your student account has been created:
                    Email: {student.email}
                    Temporary Password: {password}
                    
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
            except Exception as e:
                logger.error(f"Failed to send email to {student.email}: {str(e)}")

from .models import Student, Track  # Import Track model

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
            temp_password = self._generate_temp_password()
            student.set_password(temp_password)

        student.verification_code = self._generate_verification_code()
        student.save()

        self._send_verification_email(student, password or temp_password)
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
        return secrets.token_urlsafe(24)

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

class DashboardSerializer(serializers.ModelSerializer):
    upcoming_assignments = serializers.SerializerMethodField()
    courses = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                'upcoming_assignments', 'courses']
    
    def get_upcoming_assignments(self, obj):
        # Implement based on your Assignment model
        return []
    
    def get_courses(self, obj):
        # Implement based on your Course model
        return []
    
class MinimalStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'full_name', 'email']
        
class StudentSubmissionStatusSerializer(serializers.ModelSerializer):
    has_submitted = serializers.SerializerMethodField()
    submission_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = ['id', 'full_name', 'email', 'has_submitted', 'submission_details']
    
    def get_has_submitted(self, student):
        assignment_id = self.context.get('assignment_id')
        return AssignmentStudent.objects.filter(
            student=student,
            assignment_id=assignment_id,
            submitted=True
        ).exists()
    
    def get_submission_details(self, student):
        assignment_id = self.context.get('assignment_id')
        try:
            assignment_student = AssignmentStudent.objects.get(
                student=student,
                assignment_id=assignment_id
            )
            if assignment_student.submitted:
                submission = Submission.objects.filter(
                    assignment_student=assignment_student
                ).first()
                return {
                    'submitted_at': assignment_student.submission_date,
                    'file_url': submission.file.url if submission else None
                }
        except AssignmentStudent.DoesNotExist:
            return None
        return None