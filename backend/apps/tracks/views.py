from rest_framework import generics
from .models import Track
from .serializers import TrackSerializer
from rest_framework.permissions import AllowAny

# Existing endpoint for listing tracks (if you need it)
class TrackListView(generics.ListAPIView):
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    permission_classes = [AllowAny]

# New endpoint for creating a track (branch manager functionality)
class TrackCreateView(generics.CreateAPIView):
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    permission_classes = [AllowAny]  # Replace with your branch manager-specific permission if available
