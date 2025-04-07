from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from apps.student.models import Student
from apps.staff_members.models import StaffMember
import logging

logger = logging.getLogger(__name__)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(
        max_length=255,
        help_text="User's email address"
    )
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={'input_type': 'password'},
        help_text="User's password"
    )

    def validate(self, data):
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            raise serializers.ValidationError({
                "detail": "Both email and password are required."
            })

        user = None
        user_models = [Student, StaffMember]

        for model in user_models:
            try:
                user = model.objects.get(email=email)
                break
            except ObjectDoesNotExist:
                continue

        if user is None:
            logger.warning(f"Login attempt with non-existent email: {email}")
            raise serializers.ValidationError({
                "detail": "Invalid credentials."
            })

        if not user.check_password(password):
            logger.warning(f"Invalid password attempt for user: {email}")
            raise serializers.ValidationError({
                "detail": "Invalid credentials."
            })

        if not user.is_active:
            logger.warning(f"Login attempt for inactive account: {email}")
            raise serializers.ValidationError({
                "detail": "Account is inactive."
            })

        data['user'] = user
        return data
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        'no_active_account': 'Invalid credentials.'
    }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Standard claims
        token['sub'] = str(user.pk)
        token['email'] = user.email

        # Custom claims
        token['role'] = getattr(user, 'role', 'unknown')
        token['userType'] = 'student' if isinstance(user, Student) else 'staff'
        token['username'] = getattr(user, 'username', user.email)
        token['is_active'] = user.is_active

        # Model-specific fields
        if isinstance(user, Student):
            token['student_id'] = getattr(user, 'student_id', None)
            token['is_student'] = True
        elif isinstance(user, StaffMember):
            token['staff_id'] = getattr(user, 'staff_id', None)
            token['is_staff'] = True

        # Include branch info instead of track
        if hasattr(user, 'branch') and user.branch:
            token['branch'] = {
                'id': user.branch.id,
                'name': user.branch.name,
            }
        else:
            token['branch'] = None

        return token

    def validate(self, attrs):
        try:
            data = super().validate(attrs)
            user = self.user
            
            # Structure response to match view expectations
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
        except Exception as e:
            logger.error(f"Token generation failed: {str(e)}")
            raise serializers.ValidationError({
                "detail": "Authentication failed. Please try again."
            })

class TokenRefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()
    
    def validate(self, attrs):
        refresh = attrs.get('refresh')
        
        if not refresh:
            raise serializers.ValidationError({
                "detail": "Refresh token is required."
            })
        
        return attrs