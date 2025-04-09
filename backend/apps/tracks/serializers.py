# from rest_framework import serializers
# from apps.tracks.models import Track
# from apps.courses.models import Course
# class BaseTrackSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Track
#         fields = ['id', 'name', 'description', 'supervisor', 'track_type']

# class TrackSerializer(serializers.ModelSerializer):
#     courses = serializers.PrimaryKeyRelatedField(
#         many=True,
#         queryset=Course.objects.all(),  # Make sure to import Course model
#         required=False,  # This allows the field to be omitted
#         allow_empty=True  # This explicitly allows empty lists
#     )

#     class Meta:
#         model = Track
#         fields = ['id', 'name', 'description', 'supervisor', 'branch', 'courses', 'track_type']
    
#     def validate_branch(self, value):
#         """Ensure that the branch is provided."""
#         if not value:
#             raise serializers.ValidationError("Branch must be provided.")
#         return value

#     def create(self, validated_data):
#         courses = validated_data.pop('courses', [])  # Default to empty list
#         track = Track.objects.create(**validated_data)
#         track.courses.set(courses)  # This works with empty lists
#         return track

#     def update(self, instance, validated_data):
#         courses = validated_data.pop('courses', [])  # Default to empty list
#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)
#         instance.save()
#         instance.courses.set(courses)  # This works with empty lists
#         return instance
from rest_framework import serializers
from apps.tracks.models import Track
from apps.courses.models import Course

class BaseTrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = ['id', 'name', 'description', 'supervisor', 'track_type']

# class TrackSerializer(serializers.ModelSerializer):
#     courses = serializers.PrimaryKeyRelatedField(
#         many=True,
#         queryset=Course.objects.all(),  # Make sure to import Course model
#         required=False,  # This allows the field to be omitted
#         allow_empty=True  # This explicitly allows empty lists
#     )

#     class Meta:
#         model = Track
#         fields = ['id', 'name', 'description', 'supervisor', 'branch', 'courses', 'track_type']
    
#     def validate_branch(self, value):
#         """Ensure that the branch is provided."""
#         if not value:
#             raise serializers.ValidationError("Branch must be provided.")
#         return value

#     def create(self, validated_data):
#         courses = validated_data.pop('courses', [])  # Default to empty list
#         track = Track.objects.create(**validated_data)
#         track.courses.set(courses)  # This works with empty lists
#         return track

#     def update(self, instance, validated_data):
#         courses = validated_data.pop('courses', [])  # Default to empty list
#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)
#         instance.save()
#         instance.courses.set(courses)  # This works with empty lists
#         return instance
class TrackSerializer(serializers.ModelSerializer):
    courses = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Course.objects.all(),
        required=False,  # Allow empty list
        allow_empty=True  # Explicitly allows empty lists
    )

    class Meta:
        model = Track
        fields = ['id', 'name', 'description', 'supervisor', 'branch', 'courses', 'track_type']

    def create(self, validated_data):
        courses = validated_data.pop('courses', [])  # Default to empty list
        track = Track.objects.create(**validated_data)
        track.courses.set(courses)  # Save the many-to-many relationship manually
        return track

    def update(self, instance, validated_data):
        courses = validated_data.pop('courses', [])  # Default to empty list
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        instance.courses.set(courses)  # Save the many-to-many relationship manually
        return instance
class TrackSerializer(serializers.ModelSerializer):
    courses = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Course.objects.all(),
        required=False,  # Allow empty list
        allow_empty=True  # Explicitly allows empty lists
    )

    class Meta:
        model = Track
        fields = ['id', 'name', 'description', 'supervisor', 'branch', 'courses', 'track_type']

    def create(self, validated_data):
        courses = validated_data.pop('courses', [])  # Default to empty list
        track = Track.objects.create(**validated_data)
        track.courses.set(courses)  # Save the many-to-many relationship manually
        return track

    def update(self, instance, validated_data):
        courses = validated_data.pop('courses', [])  # Default to empty list
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        instance.courses.set(courses)  # Save the many-to-many relationship manually
        return instance

