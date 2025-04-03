from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import StaffMember
from django.utils.translation import gettext_lazy as _

class StaffMemberSerializer(serializers.ModelSerializer):
    """
    Comprehensive serializer for StaffMember model with enhanced security and validation.
    Now includes branch_location field with role-based validation.
    """
    class Meta:
        model = StaffMember
        fields = [
            'id', 'username', 'email', 'password',
            'first_name', 'last_name', 'role', 'branch_location',
            'phone', 'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'email': {'required': True},
            'role': {'required': True},
            'branch_location': {'required': False}  # Not required by default
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

    def validate(self, data):
        """Add validation for branch_location based on role"""
        role = data.get('role', self.instance.role if self.instance else None)
        branch_location = data.get('branch_location', None)
        
        # Branch managers must have a branch location
        if role == StaffMember.Role.BRANCH_MANAGER and not branch_location:
            if not self.instance or not self.instance.branch_location:
                raise serializers.ValidationError({
                    'branch_location': _('Branch managers must have an associated branch location.')
                })
        
        # Non-branch managers shouldn't have branch locations
        if role != StaffMember.Role.BRANCH_MANAGER and branch_location:
            raise serializers.ValidationError({
                'branch_location': _('Only branch managers can have branch locations.')
            })
            
        return data

    def create(self, validated_data):
        """Create staff member with proper password hashing and role validation"""
        password = validated_data.pop('password')
        staff_member = StaffMember(**validated_data)
        staff_member.set_password(password)
        
        # New staff members should set their own password on first login
        staff_member.is_active = True  
        staff_member.save()
        return staff_member

    def update(self, instance, validated_data):
        """Handle updates with proper security checks"""
        request = self.context.get('request')
        
        # Only allow staff to modify sensitive fields
        if request and not request.user.is_staff:
            for field in ['role', 'is_active', 'branch_location']:
                validated_data.pop(field, None)
        
        # Handle password change
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

    def to_representation(self, instance):
        """Customize the API response format"""
        representation = super().to_representation(instance)
        
        # Remove sensitive fields for non-staff users
        request = self.context.get('request')
        if request and not request.user.is_staff:
            for field in ['is_active', 'date_joined', 'branch_location']:
                representation.pop(field, None)
        
        return representation