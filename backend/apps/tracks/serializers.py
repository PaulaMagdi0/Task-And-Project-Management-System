# apps/tracks/serializers.py
from rest_framework import serializers
from apps.tracks.models import Track

class BaseTrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = ['id', 'name', 'description', 'supervisor', 'track_type']
class TrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = ['id', 'name', 'description', 'supervisor', 'branch', 'courses', 'track_type']
    
    def validate_branch(self, value):
        """Ensure that the branch is provided"""
        if not value:
            raise serializers.ValidationError("Branch must be provided.")
        return value

    def create(self, validated_data):
        """Create new track"""
        track = Track.objects.create(**validated_data)
        return track

    def update(self, instance, validated_data):
        """Update track"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance