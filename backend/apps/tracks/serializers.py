# File: apps/tracks/serializers.py
from rest_framework import serializers
from .models import Track

class TrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = "__all__"

    def validate_supervisor(self, value):
        if value and value.role != "supervisor":
            raise serializers.ValidationError("Assigned user must have the role 'supervisor'.")
        return value

    def to_representation(self, instance):
        # Get the default representation
        representation = super().to_representation(instance)
        # Replace the 'supervisor' field with the username if supervisor exists
        representation['supervisor'] = instance.supervisor.username if instance.supervisor else None
        return representation
