from django.contrib.auth.backends import ModelBackend
from apps.student.models import Student
from apps.staff_members.models import StaffMember
import logging

logger = logging.getLogger(__name__)

class MultiModelAuthBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, intake_id=None, **kwargs):
        if not email or not password:
            logger.debug("Missing email or password")
            return None

        email = email.lower().strip()
        logger.debug(f"Authenticating: email={email}, intake_id={intake_id}")

        user = None
        try:
            if intake_id:  # Student login
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
                    return None
            else:  # StaffMember or Student without intake
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
            logger.error(f"Error during authentication for email='{email}': {str(e)}")
            return None

        if user and user.check_password(password) and self.user_can_authenticate(user):
            logger.debug(f"Authentication successful: ID={user.id}, Type={'student' if isinstance(user, Student) else 'staff'}")
            return user
        logger.debug(f"Authentication failed for email={email}")
        return None