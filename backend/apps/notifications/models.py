from django.conf import settings
from django.db import models


class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="notifications", on_delete=models.CASCADE)
    title = models.CharField(max_length=160)
    message = models.TextField()
    notification_type = models.CharField(max_length=40, default="general")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Alert(models.Model):
    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        EMERGENCY = "emergency", "Emergency"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        ACKNOWLEDGED = "acknowledged", "Acknowledged"
        RESOLVED = "resolved", "Resolved"

    patient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="patient_alerts", on_delete=models.CASCADE)
    created_for_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="assigned_alerts",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    alert_type = models.CharField(max_length=40)
    severity = models.CharField(max_length=20, choices=Severity.choices)
    title = models.CharField(max_length=160)
    message = models.TextField()
    source_id = models.PositiveBigIntegerField(null=True, blank=True)
    source_type = models.CharField(max_length=80, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    caregiver_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

