from django.db import models
from apps.staff_members.models import StaffMember  # Updated import

class Track(models.Model):
    name = models.CharField(max_length=255, unique=True)  # Prevent duplicate names
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    supervisor = models.ForeignKey(
        StaffMember, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,  # Allow null in case the supervisor is removed
        related_name="supervised_tracks"
    )

    class Meta:
        ordering = ["-created_at"]  # Latest track first

    def save(self, *args, **kwargs):
        # Ensure the assigned supervisor has the role "supervisor"
        if self.supervisor and self.supervisor.role != "supervisor":
            raise ValueError("Assigned user must have the role 'supervisor'.")
        super().save(*args, **kwargs)

    def __str__(self):
        # Use get_full_name() for a better display if available, else fallback to username
        if self.supervisor:
            full_name = self.supervisor.get_full_name() or self.supervisor.username
        else:
            full_name = "No Supervisor"
        return f"{self.name} ({full_name})"
