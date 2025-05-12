from rest_framework import serializers
from apps.tracks.models import Track
from apps.courses.models import Course
from apps.student.serializers import IntakeSerializer
from apps.student.models import Intake
from django.db.models import Q

class BaseTrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = ['id', 'name', 'description', 'supervisor', 'track_type']

class TrackSerializer(serializers.ModelSerializer):
    courses = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Course.objects.all(),
        required=False,
        allow_empty=True
    )
    intakes = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Intake.objects.all(),
        required=False,
        allow_empty=True,
        write_only=True
    )
    intake_details = IntakeSerializer(many=True, read_only=True, source='intakes')
    available_intakes = serializers.SerializerMethodField()

    class Meta:
        model = Track
        fields = ['id', 'name', 'description', 'supervisor', 'branch', 'courses', 'track_type', 'created_at', 'intakes', 'intake_details', 'available_intakes']
        read_only_fields = ['created_at', 'intake_details', 'available_intakes']

    def get_available_intakes(self, obj):
        """
        Get intakes that are not assigned to any track or are assigned to the current track.
        """
        intakes = Intake.objects.filter(Q(track__isnull=True) | Q(track=obj))
        return IntakeSerializer(intakes, many=True).data

    def validate_intakes(self, value):
        """
        Ensure intakes are not assigned to another track.
        """
        instance = self.instance  # Current track instance (None during creation)
        for intake in value:
            if intake.track and intake.track != instance:
                raise serializers.ValidationError(
                    f"Intake {intake.name} is already assigned to track {intake.track.name}."
                )
        return value

    def create(self, validated_data):
        courses = validated_data.pop('courses', [])
        intakes = validated_data.pop('intakes', [])
        track = Track.objects.create(**validated_data)
        if courses:
            track.courses.set(courses)
        if intakes:
            for intake in intakes:
                intake.track = track
                intake.save()
        return track

    def update(self, instance, validated_data):
        courses = validated_data.pop('courses', None)
        intakes = validated_data.pop('intakes', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if courses is not None:
            instance.courses.set(courses)
        if intakes is not None:
            # Clear existing intakes not in the new list
            current_intakes = instance.intakes.all()
            for intake in current_intakes:
                if intake not in intakes:
                    intake.track = None
                    intake.save()
            # Assign new intakes
            for intake in intakes:
                intake.track = instance
                intake.save()
        return instance