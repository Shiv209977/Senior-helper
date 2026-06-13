from django.conf import settings
from django.db import models


class Medication(models.Model):
    class Frequency(models.TextChoices):
        ONCE_DAILY = "once_daily", "Once daily"
        TWICE_DAILY = "twice_daily", "Twice daily"
        CUSTOM = "custom", "Custom"

    patient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="medications", on_delete=models.CASCADE)
    medicine_name = models.CharField(max_length=160)
    dosage = models.CharField(max_length=120)
    frequency_type = models.CharField(max_length=30, choices=Frequency.choices, default=Frequency.ONCE_DAILY)
    scheduled_times = models.JSONField(default=list, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    grace_period_minutes = models.PositiveSmallIntegerField(default=60)
    instructions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["medicine_name"]

    def __str__(self):
        return self.medicine_name


class MedicationLog(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        TAKEN = "taken", "Taken"
        MISSED = "missed", "Missed"
        SKIPPED = "skipped", "Skipped"
        DELAYED = "delayed", "Delayed"

    medication = models.ForeignKey(Medication, related_name="logs", on_delete=models.CASCADE)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="medication_logs", on_delete=models.CASCADE)
    scheduled_datetime = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    marked_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-scheduled_datetime"]
        constraints = [
            models.UniqueConstraint(fields=["medication", "scheduled_datetime"], name="unique_medication_scheduled_time")
        ]

    def __str__(self):
        return f"{self.medication} - {self.status}"

