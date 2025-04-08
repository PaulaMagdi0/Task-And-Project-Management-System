from rest_framework import generics
from .models import Course  # Ensure this model exists
from .serializers import CourseSerializer  # Ensure this serializer exists
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Course
from apps.staff_members.models import StaffMember
from .serializers import CourseSerializer  # Ensure the serializer exists
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.staff_members.models import StaffMember
from .models import Course
from .serializers import CourseSerializer  # Assuming you have this serializer
# views.py

class CourseListView(generics.ListCreateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

class StaffMemberCoursesView(APIView):
    """
    Get all courses assigned to a specific instructor (StaffMember).
    """
    def get(self, request, staff_member_id):  # Corrected the argument name here
        # Get the staff member by the provided ID
        staff_member = get_object_or_404(StaffMember, id=staff_member_id)
        
        # Get all courses assigned to this staff member (instructor)
        courses = Course.objects.filter(instructor=staff_member)
        
        # Serialize the courses
        serializer = CourseSerializer(courses, many=True)
        
        # Return the serialized data in the response
        return Response(serializer.data)
