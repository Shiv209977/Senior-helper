from django.conf import settings
from django.db import models


class Appointment(models.Model):
    class AppointmentType(models.TextChoices):
        CONSULTATION = "consultation", "Consultation"
        TREATMENT = "treatment", "Treatment"
        SCAN = "scan", "Scan"
        LAB_TEST = "lab_test", "Lab test"
        FOLLOW_UP = "follow_up", "Follow up"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        UPCOMING = "upcoming", "Upcoming"
        COMPLETED = "completed", "Completed"
        MISSED = "missed", "Missed"
        CANCELLED = "cancelled", "Cancelled"

    patient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="appointments", on_delete=models.CASCADE)
    title = models.CharField(max_length=160)
    appointment_type = models.CharField(max_length=30, choices=AppointmentType.choices, default=AppointmentType.CONSULTATION)
    hospital_name = models.CharField(max_length=180, blank=True)
    doctor_name = models.CharField(max_length=160, blank=True)
    date = models.DateField()
    time = models.TimeField()
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UPCOMING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "time"]

    def __str__(self):
        return self.title

