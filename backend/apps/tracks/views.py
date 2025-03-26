from rest_framework import generics
from .models import Track
from .serializers import TrackSerializer

class TrackListView(generics.ListCreateAPIView):
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
