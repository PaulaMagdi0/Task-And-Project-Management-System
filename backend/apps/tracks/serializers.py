from rest_framework import serializers
from apps.tracks.models import Track
from apps.courses.models import Course

class BaseTrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = ['id', 'name', 'description', 'supervisor', 'track_type']

class TrackSerializer(serializers.ModelSerializer):
    # Instead of the many-to-many field, we use a SerializerMethodField to retrieve
    # courses from the reverse relation on the Course model (via its foreign key)
    courses = serializers.SerializerMethodField()

    class Meta:
        model = Track
        fields = ['id', 'name', 'description', 'supervisor', 'branch', 'courses', 'track_type']
    
    def validate_branch(self, value):
        """Ensure that the branch is provided."""
        if not value:
            raise serializers.ValidationError("Branch must be provided.")
        return value

    def get_courses(self, obj):
        # Assuming Course model's foreign key (to Track) uses the default related name "course_set"
        # We return a list of dicts with course id and name
        courses = obj.course_set.all()
        return [{"id": course.id, "name": course.name} for course in courses]

    def create(self, validated_data):
        # Create a Track instance without explicitly handling courses since
        # courses are now provided via the Course model's foreign key.
        track = Track.objects.create(**validated_data)
        return track

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
