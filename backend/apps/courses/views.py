# from rest_framework import generics
# from .models import Course  # Ensure this model exists
# from .serializers import CourseSerializer  # Ensure this serializer exists
# from rest_framework.response import Response
# from rest_framework.views import APIView
# from django.shortcuts import get_object_or_404
# from .models import Course
# from apps.staff_members.models import StaffMember
# from .serializers import CourseSerializer  # Ensure the serializer exists
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from django.shortcuts import get_object_or_404
# from apps.staff_members.models import StaffMember
# from .models import Course
# from .serializers import CourseSerializer  # Assuming you have this serializer
# # views.py

# class CourseListView(generics.ListCreateAPIView):
#     queryset = Course.objects.all()
#     serializer_class = CourseSerializer

# class StaffMemberCoursesView(APIView):
#     """
#     Get all courses assigned to a specific instructor (StaffMember).
#     """
#     def get(self, request, staff_member_id):  # Corrected the argument name here
#         # Get the staff member by the provided ID
#         staff_member = get_object_or_404(StaffMember, id=staff_member_id)
        
#         # Get all courses assigned to this staff member (instructor)
#         courses = Course.objects.filter(instructor=staff_member)
        
#         # Serialize the courses
#         serializer = CourseSerializer(courses, many=True)
        
#         # Return the serialized data in the response
#         return Response(serializer.data)
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.courses.models import Course
from apps.courses.serializers import CourseSerializer
from apps.staff_members.models import StaffMember

class CourseListView(generics.ListCreateAPIView):
    """
    GET: List all courses
    POST: Create a new course and link it to a track
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def perform_create(self, serializer):
        # Save course and ensure it's linked to the track
        course = serializer.save()
        track = course.track
        track.courses.add(course)  # Ensure course is added to the track's M2M field
        track.save()

class StaffMemberCoursesView(APIView):
    """
    GET: Get all courses assigned to a specific instructor (StaffMember).
    """
    def get(self, request, staff_member_id):
        # Get the staff member by the provided ID
        staff_member = get_object_or_404(StaffMember, id=staff_member_id)
        
        # Get all courses assigned to this staff member (instructor)
        courses = Course.objects.filter(instructor=staff_member)
        
        # Serialize the courses
        serializer = CourseSerializer(courses, many=True)
        
        # Return the serialized data in the response
        return Response(serializer.data)
