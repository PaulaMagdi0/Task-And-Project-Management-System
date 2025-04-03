from rest_framework import serializers
from apps.tracks.models import Track  # ✅  Correct import from the 'tracks' app
from apps.courses.models import Course  # ✅ Import Course model
from apps.staff_members.models import StaffMember  # ✅ Import StaffMember model

class TrackSerializer(serializers.ModelSerializer):
    courses = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), many=True, required=False
    )
    supervisor = serializers.SerializerMethodField()  # Custom field

    class Meta:
        model = Track
        fields = "__all__"

    def get_supervisor(self, obj):
        """Return supervisor details instead of just ID"""
        if obj.supervisor:
            return {
                "id": obj.supervisor.id,
                "name": obj.supervisor.get_full_name(),
                "email": obj.supervisor.email,
                "role": obj.supervisor.role,
            }
        return None
