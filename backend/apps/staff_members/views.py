from rest_framework import generics
from .models import StaffMember
from .serializers import StaffMemberSerializer

class StaffMemberListCreateView(generics.ListCreateAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer

    def perform_create(self, serializer):
        # Optional: Custom create logic if needed
        serializer.save()

class StaffMemberUpdateView(generics.UpdateAPIView):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
    lookup_field = 'pk'  # Ensures that the 'pk' field is used to identify the object
