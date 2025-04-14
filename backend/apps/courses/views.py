from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework import generics, status

from apps.courses.models import Course
from apps.courses.serializers import CourseSerializer
from apps.staff_members.models import StaffMember
from apps.tracks.models import Track

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
    
#Courses Avalible By Track AND user ID
# http://127.0.0.1:8000/api/courses/instructors/user_id/tracks/track_id/assigned_courses/
import logging
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .models import StaffMember, Track, Course
from .serializers import CourseSerializer

logger = logging.getLogger(__name__)

class AssignedCoursesInTrackView(APIView):
    def get(self, request, user_id, track_id):
        # Fetch the user (Instructor/Supervisor)
        user = get_object_or_404(StaffMember, id=user_id)

        # Fetch the track
        track = get_object_or_404(Track, id=track_id)

        # Get the courses assigned to the user that belong to the track
        assigned_courses = Course.objects.filter(instructor=user, tracks=track)

        # Log the results of the query
        logger.info(f"Assigned courses for user {user_id} in track {track_id}: {assigned_courses}")

        # Return an empty array if no courses are assigned to the user in the given track
        if not assigned_courses:
            logger.info(f"No courses found for user {user_id} in track {track_id}. Returning empty array.")
            return Response([], status=status.HTTP_200_OK)

        # Serialize the courses and return them
        course_data = CourseSerializer(assigned_courses, many=True).data
        return Response(course_data, status=status.HTTP_200_OK)
