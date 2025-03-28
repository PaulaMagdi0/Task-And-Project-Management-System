from django.db import models
from apps.accounts.models import CustomUser  # ✅ Correct relative import

class Track(models.Model):
    name = models.CharField(max_length=255, unique=True)  # Prevent duplicate names
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    supervisor = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,  # Allow null in case the supervisor is removed
        related_name="supervised_tracks"
    )

    class Meta:
        ordering = ["-created_at"]  # Latest track first

    def save(self, *args, **kwargs):
        # Ensure supervisor has the correct role before saving
        if self.supervisor and self.supervisor.role != "supervisor":
            raise ValueError("Assigned user must have the role 'supervisor'.")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.supervisor.full_name if self.supervisor else 'No Supervisor'})"
