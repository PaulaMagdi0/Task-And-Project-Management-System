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
from apps.student.models import Student
from apps.staff_members.models import StaffMember

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
    logger.debug(f"Login request received: {request.data}")
    email = request.data.get('email')
    password = request.data.get('password')
    intake_id = request.data.get('intake_id')
    logger.debug(f"Parsed: email={email}, intake_id={intake_id}, has_password={'yes' if password else 'no'}")

    if not email or not password:
        logger.error("Missing email or password")
        raise AuthenticationFailed("Email and password are required.")

    login_serializer = LoginSerializer(data=request.data, context={'request': request})
    try:
        login_serializer.is_valid(raise_exception=True)
    except serializers.ValidationError as exc:
        detail = exc.detail
        msg = detail.get('detail') if isinstance(detail, dict) and 'detail' in detail else (
            detail[0] if isinstance(detail, list) else detail
        )
        logger.error(f"Login failed: {msg}")
        raise AuthenticationFailed(msg)

    user = login_serializer.validated_data['user']
    token = MyTokenObtainPairSerializer.get_token(user)
    access_token = str(token.access_token)
    refresh_token = str(token)

    logger.info(f"Successful login for {user.email} ({'student' if isinstance(user, Student) else 'staff'})")
    resp = Response({
        "access": access_token,
        "refresh": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": getattr(user, 'username', user.email),
            "role": getattr(user, 'role', 'unknown'),
            "userType": 'student' if isinstance(user, Student) else 'staff',
            "is_active": user.is_active,
            **({
                "intake": {"id": user.intake.id, "name": user.intake.name}
            } if isinstance(user, Student) and user.intake else {}),
            **({
                "track": {"id": user.track.id, "name": user.track.name}
            } if isinstance(user, Student) and user.track else {}),
            **({
                "branch": {"id": user.branch.id, "name": user.branch.name}
            } if isinstance(user, StaffMember) and user.branch else {}),
        }
    }, status=status.HTTP_200_OK)

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
        intake_id = ser.validated_data.get('intake_id')
        logger.debug(f"Password reset request: email={email}, intake_id={intake_id}")

        user = None
        try:
            if intake_id:
                logger.debug(f"Querying Student with email='{email}', intake_id={intake_id}")
                students = Student.objects.filter(email=email, intake_id=intake_id)
                logger.debug(f"Found {students.count()} students for email='{email}', intake_id={intake_id}")
                if students.count() > 1:
                    logger.warning(f"Multiple students found for email='{email}', intake_id={intake_id}: {students.count()} records")
                    for student in students:
                        logger.debug(f" - Student ID: {student.id}, Username: {student.username}")
                user = students.first()
                if not user:
                    logger.warning(f"No student found with email='{email}', intake_id={intake_id}")
                    raise AuthenticationFailed("No student account found with that email and intake.")
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
                            logger.debug(f"Selected user in {model.__name__}: ID={user.id}, Username={user.username}")
                            break
                    except Exception as e:
                        logger.error(f"Error querying {model.__name__} for email='{email}': {str(e)}")
                        continue
        except Exception as e:
            logger.error(f"Error during user lookup for email='{email}': {str(e)}")
            raise AuthenticationFailed("An error occurred during authentication.")

        if not user:
            logger.warning(f"No account found for email='{email}'")
            raise AuthenticationFailed("No account found with that email.")

        code = f"{random.randint(1000, 9999):04d}"
        cache.set(f"pwdreset_{email}_{user.id}", code, 600)
        send_mail(
            "Your password reset code",
            f"Your OTP is: {code}",
            settings.DEFAULT_FROM_EMAIL,
            [email],
        )
        logger.debug(f"OTP sent to {email}")
        return Response({"detail": "OTP sent to your email."}, status=status.HTTP_200_OK)

class PasswordResetVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = PasswordResetVerifySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data['email']
        otp = ser.validated_data['otp']
        logger.debug(f"Verifying OTP for email={email}")

        user = None
        try:
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
                        logger.debug(f"Selected user in {model.__name__}: ID={user.id}, Username={user.username}")
                        break
                except Exception as e:
                    logger.error(f"Error querying {model.__name__} for email='{email}': {str(e)}")
                    continue
        except Exception as e:
            logger.error(f"Error during user lookup for email='{email}': {str(e)}")
            raise AuthenticationFailed("No account found with that email.")

        if not user:
            logger.warning(f"No account found for email='{email}'")
            raise AuthenticationFailed("No account found with that email.")

        if cache.get(f"pwdreset_{email}_{user.id}") != otp:
            logger.warning(f"Invalid or expired OTP for email={email}")
            return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

        logger.debug(f"OTP verified for email={email}")
        return Response({"detail": "OTP verified."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = PasswordResetConfirmSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        email = ser.validated_data['email']
        otp = ser.validated_data['otp']
        new_pw = ser.validated_data['new_password']
        logger.debug(f"Confirming password reset for email={email}")

        user = None
        try:
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
                        logger.debug(f"Selected user in {model.__name__}: ID={user.id}, Username={user.username}")
                        break
                except Exception as e:
                    logger.error(f"Error querying {model.__name__} for email='{email}': {str(e)}")
                    continue
        except Exception as e:
            logger.error(f"Error during user lookup for email='{email}': {str(e)}")
            raise AuthenticationFailed("No account found with that email.")

        if not user:
            logger.warning(f"No account found for email='{email}'")
            raise AuthenticationFailed("No account found with that email.")

        if cache.get(f"pwdreset_{email}_{user.id}") != otp:
            logger.warning(f"Invalid or expired OTP for email={email}")
            return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_pw)
        user.save()
        cache.delete(f"pwdreset_{email}_{user.id}")
        logger.debug(f"Password reset successful for email={email}")
        return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    permission_classes = [AllowAny]

class MyTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]