from django.db import transaction
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.translation import gettext_lazy as _
import secrets
import string
import logging
import openpyxl
from .models import StaffMember
from apps.branch_location.models import Branch

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
            'branch_id', 'phone'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'email': {'required': True},
            'role': {'required': True}
        }

    def get_branch(self, obj):
        if not obj.branch:
            return None
        return {
            'id': obj.branch.id,
            'name': obj.branch.name
        }

    def validate(self, data):
        role = data.get('role')
        branch = data.get('branch')
        # Ensure branch is provided for branch managers and supervisors.
        if role in [StaffMember.Role.BRANCH_MANAGER, StaffMember.Role.SUPERVISOR] and not branch:
            raise serializers.ValidationError({
                'branch': _('Branch managers and supervisors must be assigned to a branch.')
            })
        # For branch managers, ensure the branch doesn't already have a different manager.
        if role == StaffMember.Role.BRANCH_MANAGER and branch:
            if branch.manager and (not self.instance or branch.manager != self.instance):
                raise serializers.ValidationError({
                    'branch': _('This branch already has a manager assigned.')
                })
        return data

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password')
        branch = validated_data.pop('branch', None)
        staff_member = StaffMember(**validated_data)
        try:
            validate_password(password, staff_member)
            staff_member.set_password(password)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': e.messages})
        # Save the staff member; the model's save() will run full_clean().
        staff_member.save()
        # If a branch is provided, assign it and save again.
        if branch:
            staff_member.branch = branch
            staff_member.save()
        return staff_member

    @transaction.atomic
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        branch = validated_data.pop('branch', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            try:
                validate_password(password, instance)
                instance.set_password(password)
            except DjangoValidationError as e:
                raise serializers.ValidationError({'password': e.messages})
        if branch:
            instance.branch = branch
        instance.save()
        return instance
        
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
        if obj.branch is None:
            return None
        return obj.branch.name

class CreateSupervisorSerializer(serializers.ModelSerializer):
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        source='branch',
        write_only=True,
        required=True
    )
    
    class Meta:
        model = StaffMember
        fields = ['username', 'email', 'password', 'phone', 'first_name', 'last_name', 'branch_id']
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

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        branch = validated_data.pop('branch')
        
        if not password:
            password = ''.join(
                secrets.choice(string.ascii_letters + string.digits + "!@#$%^&*()")
                for _ in range(12)
            )
            
        supervisor = StaffMember(
            **validated_data,
            role=StaffMember.Role.SUPERVISOR
        )
        
        try:
            validate_password(password, supervisor)
            supervisor.set_password(password)
            supervisor.branch = branch
            supervisor.save()
            
            # Note: We don't update branch.manager since this is a supervisor
            
            return supervisor
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': e.messages})

class CreateBranchManagerSerializer(serializers.ModelSerializer):
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        source='branch',
        write_only=True,
        required=True
    )
    
    class Meta:
        model = StaffMember
        fields = ['username', 'email', 'password', 'phone', 'first_name', 'last_name', 'branch_id']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'email': {'required': True}
        }

    def validate(self, data):
        if StaffMember.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({
                'email': _('A user with this email already exists.')
            })
            
        branch = data.get('branch')
        if branch and branch.manager is not None:
            raise serializers.ValidationError({
                'branch_id': _('This branch already has a manager assigned.')
            })
            
        return data
        
    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        branch = validated_data.pop('branch')
        
        if not password:
            password = ''.join(
                secrets.choice(string.ascii_letters + string.digits + "!@#$%^&*()")
                for _ in range(12)
            )
            
        manager = StaffMember(
            **validated_data,
            role=StaffMember.Role.BRANCH_MANAGER
        )
        
        try:
            validate_password(password, manager)
            manager.set_password(password)
            manager.branch = branch
            manager.save()
            
            # Update the branch with the new manager
            branch.manager = manager
            branch.save()
            
            return manager
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': e.messages})

class ExcelUploadSupervisorSerializer(serializers.Serializer):
    excel_file = serializers.FileField()
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        required=True
    )

    def validate_excel_file(self, value):
        if not value.name.endswith(('.xlsx', '.xls')):
            raise serializers.ValidationError(_('Only Excel files are allowed (.xlsx, .xls)'))
        return value

    def create(self, validated_data):
        excel_file = validated_data['excel_file']
        branch = validated_data['branch_id']
        
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
                    phone=phone if phone else '',
                    role=StaffMember.Role.SUPERVISOR,
                    branch=branch
                )
                
                validate_password(password, supervisor)
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

        if errors and not supervisors:
            raise serializers.ValidationError({
                'errors': errors,
                'message': _('No supervisors were created due to errors in the Excel file.')
            })

        try:
            created_supervisors = StaffMember.objects.bulk_create(supervisors)
            result = {
                'status': 'success' if not errors else 'partial',
                'created': len(created_supervisors),
                'supervisors': [sup.email for sup in created_supervisors]
            }
            if errors:
                result['errors'] = errors
            return result
        except Exception as e:
            logger.error(f'Bulk create failed: {e}')
            raise serializers.ValidationError(_('Failed to create supervisors. Please try again.'))