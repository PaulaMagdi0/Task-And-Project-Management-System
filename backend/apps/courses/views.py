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
from rest_framework.permissions import IsAuthenticated
from .serializers import CourseInstructorUpdateSerializer

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
    
class AssignCourseToTrackView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logger.debug("Received request data: %s", request.data)
        
        course_id = request.data.get('course_id')
        track_id = request.data.get('track_id')
        option_id = request.data.get('option_id')  # Receive option as id (0 or 1)
        print(option_id)
        logger.debug("Course ID: %s, Track ID: %s, Option ID: %s", course_id, track_id, option_id)

        # Map option_id to option value
        if option_id == 0:
            option = 'notNull'
        elif option_id == 1:
            option = 'Null'
        else:
            logger.error("Invalid option id: %s", option_id)
            return Response({'detail': 'Invalid option id.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Handle the "option" logic
            if option == 'notNull':
                logger.debug("Assigning existing course to track")
                # Assign existing course to track
                course = Course.objects.get(pk=course_id)
                track = Track.objects.get(pk=track_id)

                logger.debug("Course: %s, Track: %s", course, track)

                if CourseTrack.objects.filter(course=course, track=track).exists():
                    logger.warning("Course already assigned to this track: %s", course_id)
                    return Response({'detail': 'This course is already assigned to this track.'}, status=status.HTTP_400_BAD_REQUEST)
                
                CourseTrack.objects.create(course=course, track=track)
                logger.info("Course assigned to track successfully.")
                return Response({'detail': 'Course assigned to track successfully.'}, status=status.HTTP_201_CREATED)

            elif option == 'Null':
                logger.debug("Creating new course and assigning to track")
                # Create a new course and assign it to the track
                track = Track.objects.get(pk=track_id)
                # Get the existing course to copy name and description
                selected_course = Course.objects.get(pk=course_id)

                # Create a new course with the same name and description as the selected course
                new_course = Course.objects.create(
                    name=selected_course.name,  # Copy the name from the selected course
                    description=selected_course.description,  # Copy the description
                    instructor=None  # Null instructor
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

#Reassign the Instructor for a Course
# class ReassignCourseInstructorView(generics.UpdateAPIView):
#     queryset = Course.objects.all()
#     serializer_class = CourseInstructorUpdateSerializer
#     permission_classes = [IsAuthenticated]

#     def patch(self, request, *args, **kwargs):
#         course_id = kwargs.get('pk')  # URL /courses/reassign-instructor/<pk>/
#         instructor_id = request.data.get('instructor_id')

#         try:
#             course = Course.objects.get(pk=course_id)
#         except Course.DoesNotExist:
#             return Response({'detail': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

#         try:
#             instructor = StaffMember.objects.get(pk=instructor_id)
#         except StaffMember.DoesNotExist:
#             return Response({'detail': 'Instructor not found.'}, status=status.HTTP_404_NOT_FOUND)

#         course.instructor = instructor
#         course.save()

#         return Response({'detail': 'Instructor reassigned successfully.'})
# Reassign the Instructor for a Course
import logging

logger = logging.getLogger(__name__)

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

            # Duplicate the course
            new_course = Course.objects.create(
                name=course.name,
                description=course.description,
                instructor=instructor
            )
            logger.info("Created new duplicated course: %s", new_course)

            # Link new course to the specified track
            CourseTrack.objects.create(course=new_course, track=track)
            logger.info("Linked new course %s to track %s", new_course, track)

            # Remove old course from this track
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

