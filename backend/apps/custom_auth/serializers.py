# apps/custom_auth/serializers.py

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.student.models import Student
from apps.staff_members.models import StaffMember

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        user = None

        # Try fetching user from the Student model
        try:
            user = Student.objects.get(email=email)
        except Student.DoesNotExist:
            pass

        # If not found in Student, try StaffMember
        if user is None:
            try:
                user = StaffMember.objects.get(email=email)
            except StaffMember.DoesNotExist:
                raise serializers.ValidationError({"detail": "No active account found with the given credentials."})

        # Ensure the password is correct
        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "Invalid credentials."})

        # Ensure the user is active
        if not user.is_active:
            raise serializers.ValidationError({"detail": "Account is inactive."})

        data['user'] = user  # Attach the user object for later use
        return data


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Include role and userType in the token
        token['role'] = user.role if hasattr(user, 'role') else 'unknown'
        token['userType'] = 'student' if isinstance(user, Student) else 'staff'
        # Include the username in the token (fallback to email if username is not available)
        token['username'] = user.username if hasattr(user, 'username') else user.email

        return token