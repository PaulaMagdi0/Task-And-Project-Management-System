# # apps/tracks/views.py
# from rest_framework import generics, status
# from rest_framework.response import Response
# from rest_framework.permissions import AllowAny, IsAuthenticated
# from .models import Track
# from .serializers import TrackSerializer
# from apps.staff_members.permissions import IsAdminOrBranchManager

# class TrackListView(generics.ListCreateAPIView):
#     """
#     GET: List all tracks (public access)
#     POST: Create new track (admin/branch manager only)
#     """
#     queryset = Track.objects.select_related('supervisor').prefetch_related('courses')
#     serializer_class = TrackSerializer

#     def get_permissions(self):
#         if self.request.method == 'GET':
#             return [AllowAny()]
#         return [IsAuthenticated(), IsAdminOrBranchManager()]

#     def create(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         self.perform_create(serializer)
#         return Response(
#             {
#                 'status': 'success',
#                 'message': 'Track created successfully',
#                 'data': serializer.data
#             },
#             status=status.HTTP_201_CREATED
#         )

# class TrackDetailView(generics.RetrieveUpdateDestroyAPIView):
#     """
#     GET: Retrieve single track (public access)
#     PUT/PATCH: Update track (admin/branch manager only)
#     DELETE: Remove track (admin/branch manager only)
#     """
#     queryset = Track.objects.select_related('supervisor').prefetch_related('courses')
#     serializer_class = TrackSerializer
#     lookup_field = 'pk'

#     def get_permissions(self):
#         if self.request.method == 'GET':
#             return [AllowAny()]
#         return [IsAuthenticated(), IsAdminOrBranchManager()]

#     def update(self, request, *args, **kwargs):
#         partial = kwargs.pop('partial', False)
#         instance = self.get_object()
#         serializer = self.get_serializer(instance, data=request.data, partial=partial)
#         serializer.is_valid(raise_exception=True)
#         self.perform_update(serializer)
        
#         return Response(
#             {
#                 'status': 'success',
#                 'message': 'Track updated successfully',
#                 'data': serializer.data
#             }
#         )

#     def destroy(self, request, *args, **kwargs):
#         instance = self.get_object()
#         self.perform_destroy(instance)
#         return Response(
#             {
#                 'status': 'success',
#                 'message': 'Track deleted successfully'
#             },
#             status=status.HTTP_204_NO_CONTENT
#         )
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  # AllowAny allows public access
from .models import Track
from .serializers import TrackSerializer
from apps.staff_members.permissions import IsAdminOrBranchManager

class TrackListView(generics.ListCreateAPIView):
    """
    GET: List all tracks (public access)
    POST: Create new track (bypasses permissions for now)
    """
    queryset = Track.objects.select_related('supervisor').prefetch_related('courses')
    serializer_class = TrackSerializer

    def get_permissions(self):
        # Bypass permissions for all requests (allow any user)
        return []  # Empty list bypasses permissions

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
        return []  # Empty list bypasses permissions

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
