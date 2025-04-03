from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from apps.staff_members.models import StaffMember

class BranchSerializer(serializers.ModelSerializer):
    manager = serializers.SerializerMethodField(read_only=True)
    manager_id = serializers.PrimaryKeyRelatedField(
        queryset=StaffMember.objects.filter(role='branch_manager'),
        source='manager',
        write_only=True,
        required=False,
        allow_null=True,
        label=_('Manager ID')
    )
    staff_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = None  # Will be set in __init__
        fields = [
            'id', 'name', 'code', 'address', 'city', 'state',
            'manager', 'manager_id', 'staff_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'code', 'staff_count']
        extra_kwargs = {
            'name': {'required': True},
            'address': {'required': True},
            'city': {'required': True},
            'state': {'required': True},
        }

    def __init__(self, *args, **kwargs):
        try:
            from .models import Branch  # Import the Branch model here
            self.Meta.model = Branch
            super().__init__(*args, **kwargs)
        except ImportError:
            raise ImportError("Failed to import models. Ensure correct paths in branch_location/models.py")

    def get_manager(self, obj):
        """Retrieve manager details"""
        if obj.manager is None:
            return None
        return {
            'id': obj.manager.id,
            'name': obj.manager.get_full_name(),
            'email': obj.manager.email
        }

    def validate_code(self, value):
        """Ensure branch code is alphanumeric"""
        if not value.isalnum():
            raise serializers.ValidationError(_("Branch code must contain only alphanumeric characters."))
        return value.upper()

    def validate(self, data):
        """Custom validation logic"""
        request = self.context.get('request')

        if request and request.method in ['POST', 'PUT', 'PATCH']:
            if 'manager' in data and data['manager']:
                if data['manager'].role != 'branch_manager':
                    raise serializers.ValidationError({'manager': _('Only branch managers can be assigned.')})

            if request.method == 'POST':
                required_fields = ['name', 'address', 'city', 'state']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    raise serializers.ValidationError({field: _('This field is required.') for field in missing_fields})

        return data

    def create(self, validated_data):
        """Handle branch creation"""
        manager = validated_data.pop('manager', None)

        # Generate a branch code if not provided
        if 'code' not in validated_data:
            validated_data['code'] = self.generate_branch_code(validated_data['name'])

        branch = self.Meta.model.objects.create(**validated_data)

        if manager:
            branch.manager = manager
            branch.save()

        return branch

    def update(self, instance, validated_data):
        """Handle branch updates"""
        manager = validated_data.pop('manager', None)

        # Update attributes
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Only update manager if it is not None
        if manager is not None:
            instance.manager = manager

        instance.save()
        return instance

    def generate_branch_code(self, branch_name):
        """Generate a unique branch code"""
        code = slugify(branch_name).upper().replace('-', '')[:6]

        counter = 1
        original_code = code
        while self.Meta.model.objects.filter(code=code).exists():
            code = f"{original_code[:5]}{counter}"
            counter += 1

        return code

    def to_representation(self, instance):
        """Customize output"""
        representation = super().to_representation(instance)
        representation['staff_count'] = instance.get_staff_count()  # Use model method for staff count
        return representation
