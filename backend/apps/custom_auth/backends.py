# apps/custom_auth/backends.py
from django.contrib.auth.backends import ModelBackend
from apps.student.models import Student
from apps.staff_members.models import StaffMember

class MultiModelAuthBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, intake_id=None, **kwargs):
        if not email or not password:
            return None

        email = email.lower().strip()
        user = None
        try:
            if intake_id:  # Student login
                user = Student.objects.get(email=email, intake_id=intake_id)
            else:  # StaffMember or Student without intake
                for model in (Student, StaffMember):
                    try:
                        user = model.objects.get(email=email)
                        break
                    except model.DoesNotExist:
                        continue
        except Student.MultipleObjectsReturned:
            return None
        except model.DoesNotExist:
            return None

        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None