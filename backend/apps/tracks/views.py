from rest_framework import generics, status
from rest_framework.response import Response
from apps.tracks.models import Track
from apps.tracks.serializers import TrackSerializer
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from apps.staff_members.models import StaffMember
from apps.courses.models import Course, CourseTrack
from apps.student.models import Intake
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from apps.courses.serializers import CourseSerializer
from apps.student.serializers import IntakeSerializer
from django.utils.dateparse import parse_date
from django.db import models

class TrackListView(generics.ListCreateAPIView):
    """
    GET: List all tracks (public access)
    POST: Create a new track (bypasses permissions for now)
    """
    queryset = Track.objects.select_related('supervisor').prefetch_related('courses', 'intakes')
    serializer_class = TrackSerializer

    def get_permissions(self):
        return []

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
    queryset = Track.objects.select_related('supervisor').prefetch_related('courses', 'intakes')
    serializer_class = TrackSerializer
    lookup_field = 'pk'

    def get_permissions(self):
        return []

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
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
        track = get_object_or_404(Track, id=track_id)
        created_at_filter = request.query_params.get('created_at', None)
        
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
            courses = track.courses.all()
        
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)

class AvailableTracksView(APIView):
    def get(self, request, user_id):
        user = get_object_or_404(StaffMember, id=user_id)
        assigned_courses = Course.objects.filter(instructor=user)
        
        if not assigned_courses:
            return Response([], status=status.HTTP_200_OK)
        
        tracks = Track.objects.filter(courses__in=assigned_courses).distinct()
        
        if not tracks:
            return Response([], status=status.HTTP_200_OK)
        
        track_data = TrackSerializer(tracks, many=True).data
        return Response(track_data, status=status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_course_from_track(request, track_id, course_id):
    try:
        track = get_object_or_404(Track, id=track_id)
        course = get_object_or_404(Course, id=course_id)
        course_track_relation = CourseTrack.objects.filter(course=course, track=track).first()
        
        if not course_track_relation:
            return Response({"error": "Course is not assigned to this track."}, status=400)
        
        course_track_relation.delete()
        return Response({"message": "Course removed from track successfully."})
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)

class IntakeTrackListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, intake_id):
        try:
            intake = Intake.objects.get(id=intake_id)
            if intake.track:
                tracks = Track.objects.filter(id=intake.track.id)
                serializer = TrackSerializer(tracks, many=True)
                return Response(serializer.data)
            return Response([])
        except Intake.DoesNotExist:
            return Response({"error": "Intake not found"}, status=status.HTTP_404_NOT_FOUND)

class AvailableIntakesForTrackView(APIView):
    """
    GET: Retrieve available intakes (unassigned or assigned to the current track)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        track = get_object_or_404(Track, pk=pk)
        intakes = Intake.objects.filter(models.Q(track__isnull=True) | models.Q(track=track))
        serializer = IntakeSerializer(intakes, many=True)
        return Response(serializer.data)