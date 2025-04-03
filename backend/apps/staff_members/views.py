from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import StaffMemberSerializer, CreateSupervisorSerializer, ExcelUploadSupervisorSerializer
from rest_framework.permissions import IsAuthenticated
from apps.staff_members.models import StaffMember
from apps.staff_members.permissions import IsAdminOrBranchManager
from rest_framework.permissions import IsAuthenticated

class StaffMemberListCreateView(generics.ListCreateAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    # permission_classes = [IsAuthenticated]
    permission_classes = []

class StaffMemberUpdateView(generics.RetrieveUpdateAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    # permission_classes = [IsAuthenticated]
    permission_classes = []

class CreateSupervisorView(generics.CreateAPIView):
    queryset = StaffMember.objects.filter(role="supervisor")
    serializer_class = CreateSupervisorSerializer
    # permission_classes = [IsAdminOrBranchManager]
    permission_classes = []

class SupervisorBulkUploadView(APIView):
    # permission_classes = [IsAdminOrBranchManager]
    permission_classes = []

    def post(self, request, *args, **kwargs):
        serializer = ExcelUploadSupervisorSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.create(validated_data=serializer.validated_data)
            if result.get("status") == "partial":
                return Response(result, status=status.HTTP_206_PARTIAL_CONTENT)
            return Response(result, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
