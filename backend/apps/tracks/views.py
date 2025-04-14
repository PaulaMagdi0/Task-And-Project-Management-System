from rest_framework import generics, status
from rest_framework.response import Response
from apps.tracks.models import Track
from apps.tracks.serializers import TrackSerializer
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from apps.staff_members.serializers import StaffMember
from apps.courses.serializers import Course


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

        if not assigned_courses:
            return Response({"message": "No courses assigned to this user"}, status=status.HTTP_404_NOT_FOUND)

        # Fetch the tracks associated with the assigned courses
        tracks = Track.objects.filter(courses__in=assigned_courses).distinct()

        # Serialize the tracks and return them
        track_data = TrackSerializer(tracks, many=True).data
        return Response(track_data, status=status.HTTP_200_OK)