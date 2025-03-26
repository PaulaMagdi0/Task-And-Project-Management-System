from rest_framework import generics
from .models import Course  # Ensure this model exists
from .serializers import CourseSerializer  # Ensure this serializer exists

class CourseListView(generics.ListAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
