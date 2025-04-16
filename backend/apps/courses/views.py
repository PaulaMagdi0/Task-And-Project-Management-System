from apps.courses.models import CourseTrack  # Make sure this is imported
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from .serializers import CourseSerializer
from apps.staff_members.models import StaffMember
from apps.tracks.models import Track
from .models import Course
import logging

logger = logging.getLogger(__name__)


class CourseListView(generics.ListCreateAPIView):
    """
    GET: List all courses
    POST: Create a new course and link it to one or more tracks
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def perform_create(self, serializer):
        """
        Handles the creation of a new course and associating it with tracks.
        """
        print("✅ Validated Data:", serializer.validated_data)
        logger.debug(f"✅ Validated Data: {serializer.validated_data}")

        # Create the course instance
        course = serializer.save()

        # Fetch instructor and tracks from validated data
        instructor = serializer.validated_data.get('instructor', None)
        tracks = serializer.validated_data.get('tracks', [])

        print("👨‍🏫 Instructor:", instructor)
        logger.debug(f"👨‍🏫 Instructor: {instructor}")

        if instructor:
            course.instructor = instructor
            course.save()

        # Add tracks to the course using the set() method to handle many-to-many relation
        print("📦 Tracks to associate:", tracks)
        logger.debug(f"📦 Tracks to associate: {tracks}")

        # Associate the tracks using the set method to handle M2M relationship
        course.tracks.set(tracks)

        print(f"✅ Associated course '{course}' with tracks")
        logger.debug(f"✅ Associated course '{course}' with tracks")

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



#Filters
from rest_framework import generics
from django.db.models import Q
from apps.courses.models import Course
from apps.courses.serializers import CourseSerializer

class CourseFilterView(generics.ListAPIView):
    serializer_class = CourseSerializer

    def get_queryset(self):
        queryset = Course.objects.all()
        
        # Get filter parameters
        search = self.request.query_params.get('search', None)
        instructor = self.request.query_params.get('instructor', None)
        track = self.request.query_params.get('track', None)

        # Build filters
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )

        if instructor:
            queryset = queryset.filter(
                Q(instructor__first_name__icontains=instructor) |
                Q(instructor__last_name__icontains=instructor) |
                Q(instructor__username__icontains=instructor)
            )

        if track:
            queryset = queryset.filter(tracks__name__icontains=track)

        return queryset.distinct()