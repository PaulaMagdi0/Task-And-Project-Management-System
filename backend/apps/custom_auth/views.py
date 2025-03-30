# views.py (in your accounts or auth app)
from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.student.models import Student
from apps.staff_members.models import StaffMember
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer

@api_view(['POST'])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    # Check if the email belongs to a student.
    try:
        student = Student.objects.get(email=email)
        if student.check_password(password):
            return Response({"message": "Hi student!"})
        else:
            return Response({"error": "Invalid credentials."}, status=400)
    except Student.DoesNotExist:
        pass  # Not a student, try staff next.
    
    # Check if the email belongs to a staff member.
    try:
        staff = StaffMember.objects.get(email=email)
        if staff.check_password(password):
            if staff.role in ["branch_manager", "supervisor", "instructor"]:
                return Response({"message": f"Hi {staff.role}!"})
            else:
                return Response({"error": "Invalid role for staff member."}, status=400)
        else:
            return Response({"error": "Invalid credentials."}, status=400)
    except StaffMember.DoesNotExist:
        return Response({"error": "Invalid credentials."}, status=400)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
