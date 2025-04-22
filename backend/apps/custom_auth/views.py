# apps/custom_auth/views.py

import random
import logging
from django.conf import settings
from django.contrib.auth import logout, get_user_model
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import (
    LoginSerializer,
    MyTokenObtainPairSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifySerializer,
    PasswordResetConfirmSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    # … your existing login logic (unchanged) …
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        raise AuthenticationFailed("Email and password are required.")

    login_serializer = LoginSerializer(data=request.data)
    try:
        login_serializer.is_valid(raise_exception=True)
    except serializers.ValidationError as exc:
        detail = exc.detail
        msg = detail.get('detail') if isinstance(detail, dict) and 'detail' in detail else (
              detail[0] if isinstance(detail, list) else detail
        )
        raise AuthenticationFailed(msg)

    user = login_serializer.validated_data['user']
    token = MyTokenObtainPairSerializer.get_token(user)
    access_token = str(token.access_token)
    refresh_token = str(token)

    resp = Response({"access": access_token, "refresh": refresh_token}, status=status.HTTP_200_OK)
    cookie_kwargs = {
        "httponly": True,
        "secure": not settings.DEBUG,
        "samesite": "Strict",
        "path": "/",
    }
    resp.set_cookie(
        "access_token",
        access_token,
        max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
        **cookie_kwargs
    )
    return resp


@api_view(['POST'])
def logout_view(request):
    try:
        logout(request)
        resp = Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        resp.delete_cookie("access_token", path="/")
        resp.delete_cookie("refresh_token", path="/")
        return resp
    except Exception:
        raise AuthenticationFailed("Error during logout.")


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = PasswordResetRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data['email']
        try:
            User.objects.get(email=email)
        except User.DoesNotExist:
            raise AuthenticationFailed("No account found with that email.")
        code = f"{random.randint(1000, 9999):04d}"
        cache.set(f"pwdreset_{email}", code, 600)
        send_mail(
            "Your password reset code",
            f"Your OTP is: {code}",
            settings.DEFAULT_FROM_EMAIL,
            [email],
        )
        return Response({"detail": "OTP sent to your email."}, status=status.HTTP_200_OK)


class PasswordResetVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = PasswordResetVerifySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data['email']
        otp = ser.validated_data['otp']
        if cache.get(f"pwdreset_{email}") != otp:
            return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "OTP verified."}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = PasswordResetConfirmSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        email = ser.validated_data['email']
        otp = ser.validated_data['otp']
        new_pw = ser.validated_data['new_password']

        if cache.get(f"pwdreset_{email}") != otp:
            return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise AuthenticationFailed("No account found with that email.")

        user.set_password(new_pw)
        user.save()
        cache.delete(f"pwdreset_{email}")

        return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    permission_classes = [AllowAny]
    # … your existing `post()` override …


class MyTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
    # … your existing `post()` override …
