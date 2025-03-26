from rest_framework import generics
from .models import Assignment
from .serializers import AssignmentSerializer

class AssignmentListView(generics.ListCreateAPIView):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
