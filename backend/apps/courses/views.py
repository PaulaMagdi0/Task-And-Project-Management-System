from apps.courses.models import CourseTrack
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from .serializers import CourseSerializer, CourseInstructorUpdateSerializer
from apps.staff_members.models import StaffMember
from apps.tracks.models import Track
from .models import Course
import logging
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)

# Existing CourseListView (unchanged)
class CourseListView(generics.ListCreateAPIView):
    """
    GET: List all courses
    POST: Create a new course and link it to one or more tracks
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]  # Add authentication

    def perform_create(self, serializer):
        """
        Handles the creation of a new course and associating it with tracks and instructor.
        """
        logger.debug(f"✅ Validated Data: {serializer.validated_data}")
        course = serializer.save()
        instructor = serializer.validated_data.get('instructor', None)
        tracks = serializer.validated_data.get('tracks', [])
        if instructor:
            course.instructor = instructor
            course.save()
        if tracks:
            course.tracks.set(tracks)
        logger.debug(f"✅ Associated course '{course}' with tracks")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response({
                'status': 'success',
                'message': 'Course created and associated with tracks and instructor.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'status': 'error',
            'message': 'Failed to create course.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

# New CourseDetailView to handle GET/PATCH/DELETE for individual courses
class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Retrieve a single course
    PATCH: Update a course
    DELETE: Delete a course
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def perform_destroy(self, instance):
        """
        Log the deletion and perform the delete operation.
        Related CourseTrack entries are automatically deleted due to on_delete=models.CASCADE.
        """
        logger.info(f"Deleting course: {instance.name} (ID: {instance.id})")
        instance.delete()

    def delete(self, request, *args, **kwargs):
        """
        Custom delete method to return a success message.
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'status': 'success',
            'message': 'Course deleted successfully.'
        }, status=status.HTTP_204_NO_CONTENT)

# Existing StaffMemberCoursesView (unchanged)
class StaffMemberCoursesView(APIView):
    def get(self, request, staff_member_id):
        staff_member = get_object_or_404(StaffMember, id=staff_member_id)
        courses = Course.objects.filter(instructor=staff_member)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)

# Existing AssignedCoursesInTrackView (unchanged)
class AssignedCoursesInTrackView(APIView):
    def get(self, request, user_id, track_id):
        user = get_object_or_404(StaffMember, id=user_id)
        track = get_object_or_404(Track, id=track_id)
        assigned_courses = Course.objects.filter(instructor=user, tracks=track)
        logger.info(f"Assigned courses for user {user_id} in track {track_id}: {assigned_courses}")
        if not assigned_courses:
            logger.info(f"No courses found for user {user_id} in track {track_id}. Returning empty array.")
            return Response([], status=status.HTTP_200_OK)
        course_data = CourseSerializer(assigned_courses, many=True).data
        return Response(course_data, status=status.HTTP_200_OK)

# Existing CourseFilterView (unchanged)
class CourseFilterView(generics.ListAPIView):
    serializer_class = CourseSerializer

    def get_queryset(self):
        queryset = Course.objects.all()
        search = self.request.query_params.get('search', None)
        instructor = self.request.query_params.get('instructor', None)
        track = self.request.query_params.get('track', None)
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

# Existing AssignCourseToTrackView (unchanged)
class AssignCourseToTrackView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logger.debug("Received request data: %s", request.data)
        course_id = request.data.get('course_id')
        track_id = request.data.get('track_id')
        option_id = request.data.get('option_id')
        logger.debug("Course ID: %s, Track ID: %s, Option ID: %s", course_id, track_id, option_id)

        if option_id == 0:
            option = 'notNull'
        elif option_id == 1:
            option = 'Null'
        else:
            logger.error("Invalid option id: %s", option_id)
            return Response({'detail': 'Invalid option id.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if option == 'notNull':
                logger.debug("Assigning existing course to track")
                course = Course.objects.get(pk=course_id)
                track = Track.objects.get(pk=track_id)
                if CourseTrack.objects.filter(course=course, track=track).exists():
                    logger.warning("Course already assigned to this track: %s", course_id)
                    return Response({'detail': 'This course is already assigned to this track.'}, status=status.HTTP_400_BAD_REQUEST)
                CourseTrack.objects.create(course=course, track=track)
                logger.info("Course assigned to track successfully.")
                return Response({'detail': 'Course assigned to track successfully.'}, status=status.HTTP_201_CREATED)
            elif option == 'Null':
                logger.debug("Creating new course and assigning to track")
                track = Track.objects.get(pk=track_id)
                selected_course = Course.objects.get(pk=course_id)
                new_course = Course.objects.create(
                    name=selected_course.name,
                    description=selected_course.description,
                    instructor=None
                )
                logger.debug("Created new course: %s", new_course)
                CourseTrack.objects.create(course=new_course, track=track)
                logger.info("New course created and assigned to track successfully.")
                return Response({'detail': 'New course created and assigned to track successfully.'}, status=status.HTTP_201_CREATED)
            else:
                logger.error("Invalid option value: %s", option)
                return Response({'detail': 'Invalid option.'}, status=status.HTTP_400_BAD_REQUEST)
        except (Course.DoesNotExist, Track.DoesNotExist) as e:
            logger.error("Error: %s", str(e))
            return Response({'detail': 'Course or Track not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception("Unexpected error: %s", str(e))
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Existing ReassignCourseInstructorView (unchanged)
class ReassignCourseInstructorView(generics.UpdateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseInstructorUpdateSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        course_id = kwargs.get('pk')
        instructor_id = request.data.get('instructor_id')
        track_id = request.data.get('track_id')
        logger.debug("PATCH request received: course_id=%s, instructor_id=%s, track_id=%s", course_id, instructor_id, track_id)

        if not instructor_id or not track_id:
            logger.error("Missing instructor_id or track_id in request data.")
            return Response({'detail': 'Both instructor_id and track_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(pk=course_id)
            logger.debug("Fetched Course: %s", course)
        except Course.DoesNotExist:
            logger.error("Course not found with id: %s", course_id)
            return Response({'detail': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            instructor = StaffMember.objects.get(pk=instructor_id)
            logger.debug("Fetched Instructor: %s", instructor)
        except StaffMember.DoesNotExist:
            logger.error("Instructor not found with id: %s", instructor_id)
            return Response({'detail': 'Instructor not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            track = Track.objects.get(pk=track_id)
            logger.debug("Fetched Track: %s", track)
        except Track.DoesNotExist:
            logger.error("Track not found with id: %s", track_id)
            return Response({'detail': 'Track not found.'}, status=status.HTTP_404_NOT_FOUND)

        course_tracks = CourseTrack.objects.filter(course=course)
        track_count = course_tracks.count()
        logger.debug("Course assigned to %s track(s)", track_count)

        if track_count > 1:
            logger.debug("Course is assigned to multiple tracks. Proceeding to duplicate course.")
            new_course = Course.objects.create(
                name=course.name,
                description=course.description,
                instructor=instructor
            )
            logger.info("Created new duplicated course: %s", new_course)
            CourseTrack.objects.create(course=new_course, track=track)
            logger.info("Linked new course %s to track %s", new_course, track)
            deleted, _ = CourseTrack.objects.filter(course=course, track=track).delete()
            logger.info("Removed original course %s from track %s. Deleted %s entries.", course, track, deleted)
            return Response({
                'detail': 'Course duplicated, new instructor assigned, and linked to track.'
            }, status=status.HTTP_201_CREATED)
        else:
            logger.debug("Course is assigned to only one track. Reassigning instructor directly.")
            course.instructor = instructor
            course.save()
            logger.info("Reassigned instructor %s to course %s successfully.", instructor, course)
            return Response({'detail': 'Instructor reassigned successfully.'}, status=status.HTTP_200_OK)