from rest_framework import serializers
from .models import Course
from apps.tracks.models import Track  # Import Track model


class CourseSerializer(serializers.ModelSerializer):
    track = serializers.PrimaryKeyRelatedField(queryset=Track.objects.all())  # Ensure queryset is provided

    class Meta:
        model = Course
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Lazy import to avoid circular import issues
        from apps.tracks.models import Track
        self.fields["track"].queryset = Track.objects.all()
