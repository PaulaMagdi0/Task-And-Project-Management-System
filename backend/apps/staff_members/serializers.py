from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.translation import gettext_lazy as _
from .models import StaffMember
from apps.branch_location.models import Branch
import secrets
import string
import openpyxl
import logging

logger = logging.getLogger(__name__)

class StaffMemberSerializer(serializers.ModelSerializer):
    branch = serializers.SerializerMethodField(read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        source='branch',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = StaffMember
        fields = [
            'id', 'username', 'email', 'password',
            'first_name', 'last_name', 'role', 'branch',
            'branch_id', 'phone', 'is_active', 'is_staff',
            'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'is_staff']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'email': {'required': True},
            'role': {'required': True}
        }

    def get_branch(self, obj):
        """Safe method to get branch information"""
        if not hasattr(obj, 'branch') or obj.branch is None:
            return None
        return {
            'id': obj.branch.id,
            'name': obj.branch.name,
            'code': obj.branch.code
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Handle case where branch relationship might not exist
        if not hasattr(self.Meta.model, 'branch'):
            self.fields.pop('branch', None)
            self.fields.pop('branch_id', None)
            self.Meta.fields = [f for f in self.Meta.fields if f not in ['branch', 'branch_id']]

    def validate_password(self, value):
        if value:
            try:
                validate_password(value)
            except DjangoValidationError as e:
                raise serializers.ValidationError(list(e.messages))
        return value

    def validate_role(self, value):
        request = self.context.get('request')
        user = request.user if request else None
        
        if user and user.is_authenticated:
            if not user.is_admin and value != StaffMember.Role.INSTRUCTOR:
                raise serializers.ValidationError(
                    _("Only administrators can assign higher roles")
                )
        return value

    def validate(self, data):
        role = data.get('role', getattr(self.instance, 'role', None) if self.instance else None)
        
        # Only validate branch if the field exists in the model
        if hasattr(self.Meta.model, 'branch'):
            branch = data.get('branch', None)
            
            if role == StaffMember.Role.BRANCH_MANAGER and not branch:
                if not self.instance or not self.instance.branch:
                    raise serializers.ValidationError({
                        'branch': _('Branch managers must have an associated branch.')
                    })
            
            if role != StaffMember.Role.BRANCH_MANAGER and branch:
                raise serializers.ValidationError({
                    'branch': _('Only branch managers can be assigned to branches.')
                })
                
        return data

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        
        # Only handle branch if the field exists in the model
        if hasattr(self.Meta.model, 'branch'):
            branch = validated_data.pop('branch', None)
        else:
            branch = None
        
        staff_member = StaffMember(**validated_data)
        
        if password:
            staff_member.set_password(password)
        
        if branch is not None and hasattr(staff_member, 'branch'):
            staff_member.branch = branch
        
        staff_member.save()
        return staff_member

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        # Only handle branch if the field exists in the model
        if hasattr(instance, 'branch'):
            branch = validated_data.pop('branch', None)
        else:
            branch = None
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        if branch is not None and hasattr(instance, 'branch'):
            instance.branch = branch
        
        instance.save()
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['full_name'] = instance.get_full_name()
        representation['is_admin'] = instance.is_admin
        
        # Only include branch information if the field exists
        if not hasattr(instance, 'branch'):
            representation.pop('branch', None)
            representation.pop('branch_id', None)
        
        return representation


class StaffMemberListSerializer(serializers.ModelSerializer):
    branch = serializers.SerializerMethodField()
    
    class Meta:
        model = StaffMember
        fields = [
            'id', 'username', 'email', 'first_name',
            'last_name', 'role', 'branch', 'is_active'
        ]

    def get_branch(self, obj):
        """Safe method to get branch information"""
        if not hasattr(obj, 'branch') or obj.branch is None:
            return None
        return obj.branch.name


class CreateSupervisorSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffMember
        fields = ['username', 'email', 'password', 'phone', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'email': {'required': True}
        }

    def validate(self, data):
        if StaffMember.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({
                'email': _('A user with this email already exists.')
            })
        return data

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        
        if not password:
            password = ''.join(
                secrets.choice(string.ascii_letters + string.digits + "!@#$%^&*()")
                for _ in range(12)
            )
            
        supervisor = StaffMember(
            **validated_data,
            role=StaffMember.Role.SUPERVISOR
        )
        supervisor.set_password(password)
        supervisor.save()
        return supervisor

class ExcelUploadSupervisorSerializer(serializers.Serializer):
    excel_file = serializers.FileField()

    def validate_excel_file(self, value):
        if not value.name.endswith(('.xlsx', '.xls')):
            raise serializers.ValidationError(_('Only Excel files are allowed (.xlsx, .xls)'))
        return value

    def create(self, validated_data):
        excel_file = validated_data['excel_file']
        try:
            wb = openpyxl.load_workbook(excel_file)
            sheet = wb.active
        except Exception as e:
            logger.error(f"Failed to open Excel file: {e}")
            raise serializers.ValidationError(_('Failed to process the Excel file. Please check the format.'))

        supervisors = []
        errors = []
        existing_emails = set(StaffMember.objects.values_list('email', flat=True))

        for row_num, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            try:
                if len(row) < 4:
                    raise ValueError(_('Incomplete row data'))
                    
                first_name, last_name, email, phone = row[:4]
                
                if not all([first_name, last_name, email]):
                    raise ValueError(_('Missing required fields'))
                
                if email in existing_emails:
                    raise ValueError(_('Email already exists'))
                
                password = ''.join(
                    secrets.choice(string.ascii_letters + string.digits + "!@#$%^&*()")
                    for _ in range(12)
                )
                
                supervisor = StaffMember(
                    username=email.split('@')[0],
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    phone=phone,
                    role=StaffMember.Role.SUPERVISOR
                )
                supervisor.set_password(password)
                supervisors.append(supervisor)
                existing_emails.add(email)
                
            except Exception as e:
                errors.append({
                    'row': row_num,
                    'error': str(e),
                    'data': row
                })
                continue

        if errors:
            logger.warning(f'Excel import completed with {len(errors)} errors')
            return {
                'status': 'partial',
                'created': len(supervisors),
                'errors': errors
            }

        try:
            created_supervisors = StaffMember.objects.bulk_create(supervisors)
            return {
                'status': 'success',
                'created': len(created_supervisors),
                'supervisors': [sup.email for sup in created_supervisors]
            }
        except Exception as e:
            logger.error(f'Bulk create failed: {e}')
            raise serializers.ValidationError(_('Failed to create supervisors. Please try again.'))
