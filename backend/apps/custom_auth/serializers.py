# apps/custom_auth/serializers.py

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from apps.student.models import Student
from apps.staff_members.models import StaffMember
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            raise serializers.ValidationError({"detail": "Both email and password are required."})

        user = None
        for model in (Student, StaffMember):
            try:
                user = model.objects.get(email=email)
                break
            except ObjectDoesNotExist:
                continue

        if user is None:
            logger.warning(f"Login attempt with non-existent email: {email}")
            raise serializers.ValidationError({"detail": "No account found with that email."})

        if not user.check_password(password):
            logger.warning(f"Invalid password attempt for user: {email}")
            raise serializers.ValidationError({"detail": "Password is incorrect."})

        if not user.is_active:
            logger.warning(f"Login attempt for inactive account: {email}")
            raise serializers.ValidationError({"detail": "Account is inactive."})

        data['user'] = user
        return data


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        'no_active_account': 'Invalid credentials.'
    }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        from apps.student.models import Student  # avoid circular import

        token['sub'] = str(user.pk)
        token['email'] = user.email
        token['role'] = getattr(user, 'role', 'unknown')
        token['userType'] = 'student' if isinstance(user, Student) else 'staff'
        token['username'] = getattr(user, 'username', user.email)
        token['is_active'] = user.is_active

        if isinstance(user, Student):
            token['student_id'] = getattr(user, 'student_id', None)
            token['is_student'] = True
        else:
            token['staff_id'] = getattr(user, 'staff_id', None)
            token['is_staff'] = True

        if hasattr(user, 'branch') and user.branch:
            token['branch'] = {'id': user.branch.id, 'name': user.branch.name}
        else:
            token['branch'] = None

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        return {
            'access': data['access'],
            'refresh': data['refresh'],
            'user': {
                'id': user.pk,
                'email': user.email,
                'role': getattr(user, 'role', 'unknown'),
                'userType': 'student' if isinstance(user, Student) else 'staff',
                'username': getattr(user, 'username', user.email),
                'is_active': user.is_active,
                **({'student_id': user.student_id} if isinstance(user, Student) else {}),
                **({'staff_id': user.staff_id} if isinstance(user, StaffMember) else {}),
                'track': {
                    'id': user.track.id,
                    'name': user.track.name,
                } if hasattr(user, 'track') and user.track else None,
            }
        }


class TokenRefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        if not attrs.get('refresh'):
            raise serializers.ValidationError({"detail": "Refresh token is required."})
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        """
        Run the new password through Django's validators,
        so you get e.g. "too common", "too similar to username", etc.
        """
        email = self.initial_data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with that email.")

        try:
            validate_password(value, user)
        except DjangoValidationError as e:
            # e.messages is a list of human‐readable errors
            raise serializers.ValidationError(e.messages)
        return value

    def validate(self, data):
        # OTP check itself happens in the view; nothing extra here
        return data
