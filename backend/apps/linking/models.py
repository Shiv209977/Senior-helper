from django.conf import settings
from django.db import models
from django.utils import timezone


class CaregiverLink(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACTIVE = "active", "Active"
        REVOKED = "revoked", "Revoked"

    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="patient_links",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "patient"},
    )
    caregiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="caregiver_links",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        limit_choices_to={"role": "caregiver"},
    )
    invite_code = models.CharField(max_length=16, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["invite_code"]), models.Index(fields=["status"])]

    def activate(self, caregiver):
        self.caregiver = caregiver
        self.status = self.Status.ACTIVE
        self.approved_at = timezone.now()
        self.revoked_at = None
        self.save(update_fields=["caregiver", "status", "approved_at", "revoked_at"])

    def revoke(self):
        self.status = self.Status.REVOKED
        self.revoked_at = timezone.now()
        self.save(update_fields=["status", "revoked_at"])

    def __str__(self):
        return f"{self.patient} -> {self.caregiver or 'pending'}"

