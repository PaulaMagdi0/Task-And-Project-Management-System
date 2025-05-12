from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from apps.student.models import Student
from apps.staff_members.models import StaffMember
import logging

logger = logging.getLogger(__name__)

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        """
        Override to handle user lookup for both Student and StaffMember models.
        """
        try:
            user_id = validated_token['user_id']
            user_type = validated_token.get('userType')
        except KeyError:
            logger.error("Token missing user_id or userType")
            raise InvalidToken("Token contained no recognizable user identification")

        logger.debug(f"Looking up user: ID={user_id}, Type={user_type}")

        user = None
        try:
            if user_type == 'student':
                user = Student.objects.get(id=user_id)
            elif user_type == 'staff':
                user = StaffMember.objects.get(id=user_id)
            else:
                logger.error(f"Invalid userType in token: {user_type}")
                raise AuthenticationFailed("Invalid user type in token")
        except (Student.DoesNotExist, StaffMember.DoesNotExist):
            logger.error(f"User not found: ID={user_id}, Type={user_type}")
            raise AuthenticationFailed("User not found")
        except Exception as e:
            logger.error(f"Error during user lookup: {str(e)}")
            raise AuthenticationFailed("Error during user authentication")

        if not user.is_active:
            logger.warning(f"Inactive user attempted authentication: ID={user_id}")
            raise AuthenticationFailed("User is inactive")

        logger.debug(f"Authenticated user: ID={user_id}, Type={user_type}")
        return user