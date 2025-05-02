from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from apps.student.models import Student, Intake
from apps.staff_members.models import StaffMember
from apps.custom_auth.backends import MultiModelAuthBackend
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    intake_id = serializers.PrimaryKeyRelatedField(
        queryset=Intake.objects.all(),
        required=False,
        allow_null=True,
        help_text="ID of the intake (required for student login)"
    )

    def validate(self, data):
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        intake = data.get('intake_id')

        logger.debug(f"Validating login: email={email}, intake_id={intake.id if intake else None}")

        if not email or not password:
            raise serializers.ValidationError({"detail": "Both email and password are required."})

        user = None
        backend = MultiModelAuthBackend()
        try:
            logger.debug(f"Calling authenticate with email={email}, intake_id={intake.id if intake else None}")
            user = backend.authenticate(
                request=self.context.get('request'),
                email=email,
                password=password,
                intake_id=intake.id if intake else None
            )
            if user:
                logger.debug(f"Backend authenticated user: ID={user.id}, Type={'student' if isinstance(user, Student) else 'staff'}")
            else:
                logger.debug(f"Backend authentication failed for email={email}")
        except Exception as e:
            logger.error(f"Error during backend authentication for email='{email}': {str(e)}")
            raise serializers.ValidationError({"detail": "An error occurred during authentication."})

        if user is None:
            try:
                if intake:
                    logger.debug(f"Querying Student with email='{email}', intake_id={intake.id}")
                    students = Student.objects.filter(email=email, intake=intake)
                    logger.debug(f"Found {students.count()} students for email='{email}', intake_id={intake.id}")
                    if students.count() > 1:
                        logger.warning(f"Multiple students found for email='{email}', intake_id={intake.id}: {students.count()} records")
                        for student in students:
                            logger.debug(f" - Student ID: {student.id}, Username: {student.username}")
                    user = students.first()
                    if not user:
                        logger.warning(f"No student found with email='{email}', intake_id={intake.id}")
                        raise serializers.ValidationError({"detail": "No student account found with that email and intake."})
                else:
                    logger.debug(f"Querying without intake_id for email='{email}'")
                    for model in (Student, StaffMember):
                        try:
                            users = model.objects.filter(email=email)
                            logger.debug(f"Found {users.count()} users in {model.__name__} for email='{email}'")
                            if users.count() > 1:
                                logger.warning(f"Multiple {model.__name__} found for email='{email}': {users.count()} records")
                                for u in users:
                                    logger.debug(f" - {model.__name__} ID: {u.id}, Username: {u.username}")
                            user = users.first()
                            if user:
                                break
                        except Exception as e:
                            logger.error(f"Error querying {model.__name__} for email='{email}': {str(e)}")
                            continue
            except Exception as e:
                logger.error(f"Error during user lookup for email='{email}': {str(e)}")
                raise serializers.ValidationError({"detail": "An error occurred during authentication."})

        if user is None:
            logger.warning(f"Login attempt with non-existent email: {email}")
            raise serializers.ValidationError({"detail": "No account found with that email."})

        if isinstance(user, Student) and not intake:
            logger.warning(f"Student login attempt for '{email}' without intake_id")
            raise serializers.ValidationError({"detail": "Intake ID is required for student login."})

        if not user.check_password(password):
            logger.warning(f"Invalid password attempt for user: {email}")
            raise serializers.ValidationError({"detail": "Password is incorrect."})

        if not user.is_active:
            logger.warning(f"Login attempt for inactive account: {email}")
            raise serializers.ValidationError({"detail": "Account is inactive."})

        logger.debug(f"User validated: ID={user.id}, Type={'student' if isinstance(user, Student) else 'staff'}")
        data['user'] = user
        return data

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        'no_active_account': 'Invalid credentials.'
    }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['sub'] = str(user.pk)
        token['email'] = user.email
        token['role'] = getattr(user, 'role', 'unknown')
        token['userType'] = 'student' if isinstance(user, Student) else 'staff'
        token['username'] = getattr(user, 'username', user.email)
        token['is_active'] = user.is_active

        if isinstance(user, Student):
            token['is_student'] = True
            token['intake'] = {
                'id': user.intake.id,
                'name': user.intake.name
            } if user.intake else None
            token['track'] = {
                'id': user.track.id,
                'name': user.track.name
            } if user.track else None
        else:
            token['is_staff'] = True
            token['branch'] = {
                'id': user.branch.id,
                'name': user.branch.name
            } if user.branch else None

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
                **({
                    'intake': {
                        'id': user.intake.id,
                        'name': user.intake.name
                    }
                } if isinstance(user, Student) and user.intake else {}),
                **({
                    'track': {
                        'id': user.track.id,
                        'name': user.track.name
                    }
                } if isinstance(user, Student) and user.track else {}),
                **({
                    'branch': {
                        'id': user.branch.id,
                        'name': user.branch.name
                    }
                } if isinstance(user, StaffMember) and user.branch else {}),
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
    intake_id = serializers.IntegerField(required=False, allow_null=True)

class PasswordResetVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        email = self.initial_data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with that email.")

        try:
            validate_password(value, user)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def validate(self, data):
        return data