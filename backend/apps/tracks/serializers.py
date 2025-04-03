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
    