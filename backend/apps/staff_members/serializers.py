# File: apps/staff_members/serializers.py

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import StaffMember
import secrets
import string
import openpyxl
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

class StaffMemberSerializer(serializers.ModelSerializer):
    """
    Comprehensive serializer for StaffMember model with enhanced security and validation.
    Handles creation, updates, and password management with proper role-based controls.
    """
    class Meta:
        model = StaffMember
        fields = [
            'id', 'username', 'email', 'password',
            'first_name', 'last_name', 'role', 'phone',
            'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'email': {'required': True},
            'role': {'required': True}
        }

    def validate_password(self, value):
        """Enforce password validation rules"""
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate_role(self, value):
        """Ensure role is valid and prevent privilege escalation"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if not request.user.is_staff and value != StaffMember.Role.INSTRUCTOR:
                raise serializers.ValidationError(
                    _("Only administrators can assign higher roles")
                )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        staff_member = StaffMember(**validated_data)
        if password:
            staff_member.set_password(password)
        staff_member.save()
        return staff_member

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class CreateSupervisorSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a supervisor.
    Role is forced to "supervisor".
    """
    class Meta:
        model = StaffMember
        fields = ["username", "email", "password", "phone"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        validated_data["role"] = "supervisor"
        password = validated_data.pop("password", None)
        supervisor = StaffMember(**validated_data)
        if password:
            supervisor.set_password(password)
        else:
            generated_password = ''.join(
                secrets.choice(string.ascii_letters + string.digits + "!@#$%^&*()")
                for _ in range(12)
            )
            supervisor.set_password(generated_password)
        supervisor.save()
        return supervisor

class ExcelUploadSupervisorSerializer(serializers.Serializer):
    """
    Serializer for bulk uploading supervisors via Excel.
    Expects an Excel file with columns: first_name, last_name, email, phone.
    """
    excel_file = serializers.FileField()

    def save_supervisors_from_excel(self):
        excel_file = self.validated_data["excel_file"]
        try:
            wb = openpyxl.load_workbook(excel_file)
            sheet = wb.active
        except Exception as e:
            logger.error(f"Failed to open Excel file: {e}")
            raise ValidationError("Failed to open the Excel file.")

        supervisors = []
        existing_emails = set(
            StaffMember.objects.filter(role="supervisor").values_list("email", flat=True)
        )

        for row in sheet.iter_rows(min_row=2, values_only=True):
            first_name, last_name, email, phone = row
            if not email or email in existing_emails:
                logger.warning(f"Skipping invalid or existing email: {email}")
                continue
            password = ''.join(
                secrets.choice(string.ascii_letters + string.digits + "!@#$%^&*()")
                for _ in range(12)
            )
            supervisor = StaffMember(
                username=email.split("@")[0],
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone=phone,
                role="supervisor"
            )
            supervisor.set_password(password)
            supervisor.raw_password = password  # For notification purposes, if needed
            supervisors.append(supervisor)

        try:
            created_supervisors = StaffMember.objects.bulk_create(supervisors)
        except Exception as e:
            logger.error(f"Error during bulk creation: {e}")
            raise ValidationError("An error occurred while creating supervisors.")

        return {
            "message": f"{len(created_supervisors)} supervisors created successfully.",
            "supervisors": [sup.email for sup in created_supervisors],
        }
