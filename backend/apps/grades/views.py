from rest_framework import generics
from .models import Grade
from .serializers import GradeSerializer

class GradeListView(generics.ListCreateAPIView):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
