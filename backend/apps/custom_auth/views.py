from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.student.models import Student
from apps.staff_members.models import StaffMember
from rest_framework.exceptions import AuthenticationFailed
from .serializers import MyTokenObtainPairSerializer, LoginSerializer
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError  # Import the proper exceptions

@api_view(['POST'])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    try:
        login_serializer = LoginSerializer(data=request.data)
        if login_serializer.is_valid():
            user = login_serializer.validated_data['user']
            
            # Get the token for the user
            token = MyTokenObtainPairSerializer.get_token(user)
            
            # Check if user is found in the request
            print(f"Authenticated User: {user}")

            # Return response
            return Response({
                'access_token': str(token),
                'role': token['role'],
                'userType': token['userType']
            })
        else:
            raise AuthenticationFailed("Invalid credentials")
    except (InvalidToken, TokenError):
        raise AuthenticationFailed("Token could not be validated")

# Ensure the TokenObtainPairView is correctly set up
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
