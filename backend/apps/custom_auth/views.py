# apps/custom_auth/views.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, LoginSerializer
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError  # Import the proper exceptions

# Login view for handling username/password authentication and token generation
@api_view(['POST'])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    try:
        # Validate the login credentials using the LoginSerializer
        login_serializer = LoginSerializer(data=request.data)
        if login_serializer.is_valid():
            user = login_serializer.validated_data['user']

            # Get the token for the user using the custom serializer
            token = MyTokenObtainPairSerializer.get_token(user)

            # You can print the user for debugging
            print(f"Authenticated User: {user}")

            # Return response with access and refresh tokens, along with role and userType
            return Response({
                'access_token': str(token.access_token),  # Access token
                'refresh_token': str(token),  # Refresh token
                'role': token['role'],  # Custom role added to the token
                'userType': token['userType'],  # Custom userType added to the token
            })
        else:
            raise AuthenticationFailed("Invalid credentials")
    except (InvalidToken, TokenError):
        raise AuthenticationFailed("Token could not be validated")
    except Exception as e:
        raise AuthenticationFailed(f"An error occurred: {str(e)}")


# TokenObtainPairView class for handling token generation using JWT
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
