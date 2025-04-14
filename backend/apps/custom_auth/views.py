from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, LoginSerializer
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
from django.contrib.auth import logout
from rest_framework.permissions import AllowAny
import logging

logger = logging.getLogger(__name__)
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Handle email/password authentication and JWT token generation.
    Returns only the JWT access token in the response.
    """
    try:
        if not all(key in request.data for key in ['email', 'password']):
            raise AuthenticationFailed(
                {"detail": "Email and password are required."},
                code="missing_credentials"
            )
        
        # Validate credentials using LoginSerializer
        login_serializer = LoginSerializer(data=request.data)
        login_serializer.is_valid(raise_exception=True)
        user = login_serializer.validated_data['user']
        
        # Generate token using the custom token serializer
        token = MyTokenObtainPairSerializer.get_token(user)
        access_token = str(token.access_token)
        refresh_token = str(token)
        # Optionally, you can set the access token as an HTTP-only cookie
        response = Response({
    "access": access_token,
    "refresh": refresh_token,
}, status=200)
        cookie_settings = {
            "httponly": True,
            "secure": not settings.DEBUG,
            "samesite": "Strict",
            "path": settings.JWT_AUTH['COOKIE_PATH'],
        }
        response.set_cookie(
            key=settings.JWT_AUTH['ACCESS_TOKEN_COOKIE'],
            value=access_token,
            max_age=settings.JWT_AUTH['ACCESS_TOKEN_LIFETIME'].total_seconds(),
            **cookie_settings
        )
        return response

    except AuthenticationFailed as e:
        logger.warning(f"Authentication failed for email {request.data.get('email')}: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}", exc_info=True)
        raise AuthenticationFailed(
            {"detail": "An unexpected error occurred during login."},
            code="login_error"
        )
@api_view(['POST'])

def logout_view(request):
    """
    Handle user logout by clearing JWT cookies.
    """
    try:
        logout(request)
        response = Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )
        
        # Clear the cookies
        response.delete_cookie(settings.JWT_AUTH['ACCESS_TOKEN_COOKIE'])
        response.delete_cookie(settings.JWT_AUTH['REFRESH_TOKEN_COOKIE'])
        
        logger.info(f"User {request.user.id if request.user.is_authenticated else 'unknown'} logged out")
        return response
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}", exc_info=True)
        return Response(
            {'detail': 'Error during logout'},
            status=status.HTTP_400_BAD_REQUEST
        )


class MyTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token obtain view that sets HTTP-only cookies.
    """
    serializer_class = MyTokenObtainPairSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            access_token = response.data['access']
            refresh_token = response.data['refresh']
            
            # Create new response without tokens in body
            cookie_response = Response({
                'message': 'Authentication successful',
                'user': {
                    'id': self.user.id,
                    'email': self.user.email,
                    'role': getattr(self.user, 'role', None),
                    'user_type': 'student' if hasattr(self.user, 'is_student') else 'staff',
                }
            }, status=status.HTTP_200_OK)
            
            # Cookie settings
            cookie_settings = {
                'httponly': True,
                'secure': not settings.DEBUG,
                'samesite': 'Strict',
                'path': settings.JWT_AUTH['COOKIE_PATH'],
            }
            
            # Set cookies
            cookie_response.set_cookie(
                key=settings.JWT_AUTH['ACCESS_TOKEN_COOKIE'],
                value=access_token,
                max_age=settings.JWT_AUTH['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                **cookie_settings
            )
            
            cookie_response.set_cookie(
                key=settings.JWT_AUTH['REFRESH_TOKEN_COOKIE'],
                value=refresh_token,
                max_age=settings.JWT_AUTH['REFRESH_TOKEN_LIFETIME'].total_seconds(),
                **cookie_settings
            )
            
            return cookie_response
            
        except (InvalidToken, TokenError) as e:
            logger.error(f"Token error: {str(e)}")
            raise AuthenticationFailed(
                {"detail": "Invalid credentials"},
                code="invalid_credentials"
            )
        except Exception as e:
            logger.error(f"Unexpected error in token generation: {str(e)}", exc_info=True)
            raise AuthenticationFailed(
                {"detail": "Authentication service unavailable"},
                code="auth_service_error"
            )


class MyTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view that handles refresh tokens from cookies.
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        try:
            # Try to get refresh token from cookies if not in body
            if 'refresh' not in request.data and settings.JWT_AUTH['REFRESH_TOKEN_COOKIE'] in request.COOKIES:
                request.data['refresh'] = request.COOKIES[settings.JWT_AUTH['REFRESH_TOKEN_COOKIE']]
            
            response = super().post(request, *args, **kwargs)
            
            if 'access' in response.data:
                # Create new response
                cookie_response = Response({
                    'message': 'Token refreshed successfully'
                }, status=status.HTTP_200_OK)
                
                # Set the new access token cookie
                cookie_response.set_cookie(
                    key=settings.JWT_AUTH['ACCESS_TOKEN_COOKIE'],
                    value=response.data['access'],
                    max_age=settings.JWT_AUTH['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Strict',
                    path=settings.JWT_AUTH['COOKIE_PATH']
                )
                
                return cookie_response
            
            return response
            
        except (InvalidToken, TokenError) as e:
            logger.error(f"Refresh token error: {str(e)}")
            raise AuthenticationFailed(
                {"detail": "Invalid or expired refresh token"},
                code="invalid_refresh_token"
            )
        except Exception as e:
            logger.error(f"Unexpected error in token refresh: {str(e)}", exc_info=True)
            raise AuthenticationFailed(
                {"detail": "Error refreshing token"},
                code="refresh_error"
            )