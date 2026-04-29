from django.conf import settings
from django.db import models


class VitalSign(models.Model):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="vital_signs", on_delete=models.CASCADE)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="recorded_vitals", on_delete=models.CASCADE)
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    heart_rate = models.PositiveSmallIntegerField(null=True, blank=True)
    oxygen_level = models.PositiveSmallIntegerField(null=True, blank=True)
    systolic_bp = models.PositiveSmallIntegerField(null=True, blank=True)
    diastolic_bp = models.PositiveSmallIntegerField(null=True, blank=True)
    pain_level = models.PositiveSmallIntegerField(default=0)
    fatigue_level = models.PositiveSmallIntegerField(default=0)
    appetite_level = models.PositiveSmallIntegerField(default=5)
    recorded_at = models.DateTimeField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-recorded_at"]

    def __str__(self):
        return f"Vitals for {self.patient}"


class SymptomRecord(models.Model):
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="symptom_records", on_delete=models.CASCADE)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="recorded_symptoms", on_delete=models.CASCADE)
    symptom_date = models.DateField()
    fever = models.BooleanField(default=False)
    nausea = models.BooleanField(default=False)
    vomiting = models.BooleanField(default=False)
    severe_pain = models.BooleanField(default=False)
    breathing_difficulty = models.BooleanField(default=False)
    dizziness = models.BooleanField(default=False)
    bleeding = models.BooleanField(default=False)
    fatigue = models.BooleanField(default=False)
    appetite_loss = models.BooleanField(default=False)
    infection_signs = models.BooleanField(default=False)
    symptom_severity_score = models.PositiveSmallIntegerField(default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-symptom_date", "-created_at"]

    def __str__(self):
        return f"Symptoms for {self.patient} on {self.symptom_date}"


class EmergencyRequest(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        ACKNOWLEDGED = "acknowledged", "Acknowledged"
        RESOLVED = "resolved", "Resolved"
        CANCELLED = "cancelled", "Cancelled"

    patient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="emergency_requests", on_delete=models.CASCADE)
    triggered_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="triggered_emergencies", on_delete=models.CASCADE)
    emergency_type = models.CharField(max_length=80, default="urgent_help")
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="acknowledged_emergencies",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Emergency for {self.patient}"

