from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import StaffMember
from .serializers import StaffMemberSerializer, CreateSupervisorSerializer, ExcelUploadSupervisorSerializer
from rest_framework.permissions import AllowAny

# Existing endpoints for listing and updating staff members:
class StaffMemberListCreateView(generics.ListCreateAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    permission_classes = [AllowAny]

class StaffMemberUpdateView(generics.RetrieveUpdateAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    permission_classes = [AllowAny]

# New endpoint for creating a supervisor (branch manager functionality)
class CreateSupervisorView(generics.CreateAPIView):
    queryset = StaffMember.objects.filter(role="supervisor")
    serializer_class = CreateSupervisorSerializer
    permission_classes = [AllowAny]  # Replace with your branch manager-specific permission if available

# New endpoint for bulk uploading supervisors via Excel (branch manager functionality)
class SupervisorBulkUploadView(APIView):
    permission_classes = [AllowAny]  # Replace with your branch manager-specific permission if available

    def post(self, request, *args, **kwargs):
        serializer = ExcelUploadSupervisorSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save_supervisors_from_excel()
            return Response(result, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
