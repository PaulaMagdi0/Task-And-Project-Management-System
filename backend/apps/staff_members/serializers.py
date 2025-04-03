from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import StaffMember
from django.utils.translation import gettext_lazy as _

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
            for field in ['role', 'is_active']:
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
            representation.pop('is_active', None)
            representation.pop('date_joined', None)
        
        return representation