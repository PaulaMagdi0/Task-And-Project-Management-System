from rest_framework import generics, status
from rest_framework.response import Response
from apps.tracks.models import Track
from apps.tracks.serializers import TrackSerializer
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from apps.staff_members.serializers import StaffMember
from apps.courses.serializers import Course
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.courses.models import Course, CourseTrack

class TrackListView(generics.ListCreateAPIView):
    """
    GET: List all tracks (public access)
    POST: Create a new track (bypasses permissions for now)
    """
    queryset = Track.objects.select_related('supervisor').prefetch_related('courses')
    serializer_class = TrackSerializer

    def get_permissions(self):
        # Bypass permissions for all requests (allow any user)
        return []  # Empty list bypasses permissions for public access

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {
                'status': 'success',
                'message': 'Track created successfully',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED
        )

class TrackDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve single track (public access)
    PUT/PATCH: Update track (bypasses permissions for now)
    DELETE: Remove track (bypasses permissions for now)
    """
    queryset = Track.objects.select_related('supervisor').prefetch_related('courses')
    serializer_class = TrackSerializer
    lookup_field = 'pk'

    def get_permissions(self):
        # Bypass permissions for all requests (allow any user)
        return []  # Empty list bypasses permissions for public access

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)  # Supports partial updates
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(
            {
                'status': 'success',
                'message': 'Track updated successfully',
                'data': serializer.data
            }
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {
                'status': 'success',
                'message': 'Track deleted successfully'
            },
            status=status.HTTP_204_NO_CONTENT
        )

class TrackCoursesView(APIView):
    def get(self, request, track_id):
        # Fetch the track using the track_id, or return 404 if not found
        track = get_object_or_404(Track, id=track_id)
        
        # Fetch the 'created_at' filter from query params if provided
        created_at_filter = request.query_params.get('created_at', None)
        
        # If 'created_at' filter is provided, convert to date and filter the courses
        if created_at_filter:
            try:
                created_at_date = parse_date(created_at_filter)
                if created_at_date:
                    courses = track.courses.filter(created_at__date=created_at_date)
                else:
                    return Response({"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Fetch all courses if no 'created_at' filter is provided
            courses = track.courses.all()
        
        # Serialize the courses
        serializer = CourseSerializer(courses, many=True)
        
        # Return the serialized data
        return Response(serializer.data)

# Avalible Track For Instructor 
# http://127.0.0.1:8000/api/tracks/instructors/insturctor_id/available_tracks/

class AvailableTracksView(APIView):
    def get(self, request, user_id):
        # Fetch the user (Instructor/Supervisor)
        user = get_object_or_404(StaffMember, id=user_id)

        # Get the courses assigned to the user
        assigned_courses = Course.objects.filter(instructor=user)  # Modify based on your logic if needed

        # If no courses are assigned, return an empty array for tracks
        if not assigned_courses:
            return Response([], status=status.HTTP_200_OK)

        # Fetch the tracks associated with the assigned courses
        tracks = Track.objects.filter(courses__in=assigned_courses).distinct()

        # Return empty array if no tracks are found
        if not tracks:
            return Response([], status=status.HTTP_200_OK)

        # Serialize the tracks and return them
        track_data = TrackSerializer(tracks, many=True).data
        return Response(track_data, status=status.HTTP_200_OK)

# remove Course From Track
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_course_from_track(request, track_id, course_id):
    try:
        # Fetch the track and course from the database
        track = get_object_or_404(Track, id=track_id)
        course = get_object_or_404(Course, id=course_id)

        # Check if the course is related to the track
        course_track_relation = CourseTrack.objects.filter(course=course, track=track).first()

        if not course_track_relation:
            return Response({"error": "Course is not assigned to this track."}, status=400)

        # Delete the relationship
        course_track_relation.delete()

        # Return a success message
        return Response({"message": "Course removed from track successfully."})

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
from apps.student.models import Intake
class IntakeTrackListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, intake_id):
        try:
            intake = Intake.objects.get(id=intake_id)
            tracks = Track.objects.filter(intakes=intake)
            serializer = TrackSerializer(tracks, many=True)
            return Response(serializer.data)
        except Intake.DoesNotExist:
            return Response({"error": "Intake not found"}, status=status.HTTP_404_NOT_FOUND)