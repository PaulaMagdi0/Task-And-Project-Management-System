from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Ensure that the serializer looks for the email field instead of username
    username_field = 'email'

    def validate(self, attrs):
        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['userType'] = 'staff'
        return token