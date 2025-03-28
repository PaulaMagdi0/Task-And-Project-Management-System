from rest_framework import serializers
from .models import StaffMember

class StaffMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for StaffMember model, used for creating and updating staff members.
    """
    class Meta:
        model = StaffMember
        fields = ["username", "email", "password", "role", "phone"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        """
        Create a StaffMember instance and handle password hashing.
        """
        password = validated_data.pop("password", None)
        staff_member = StaffMember(**validated_data)
        if password:
            staff_member.set_password(password)  # Hash the password before saving
        staff_member.save()
        return staff_member

    def update(self, instance, validated_data):
        """
        Update the StaffMember instance. Handles password changes and general updates.
        """
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)  # Hash the new password if it's provided

        instance.save()  # Save the updated instance
        return instance
