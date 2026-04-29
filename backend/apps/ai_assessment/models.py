from django.conf import settings
from django.db import models

from apps.notifications.models import Alert


class AIRiskAssessment(models.Model):
    class Category(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        EMERGENCY = "emergency", "Emergency"

    patient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="ai_assessments", on_delete=models.CASCADE)
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="requested_ai_assessments", on_delete=models.CASCADE)
    risk_score = models.PositiveSmallIntegerField()
    risk_category = models.CharField(max_length=20, choices=Category.choices)
    confidence = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    reasons = models.JSONField(default=list)
    suggested_action = models.TextField()
    disclaimer = models.TextField()
    input_snapshot = models.JSONField(default=dict)
    model_version = models.CharField(max_length=80, default="rule-based-v1")
    rule_score = models.PositiveSmallIntegerField(default=0)
    ml_score = models.PositiveSmallIntegerField(null=True, blank=True)
    created_alert = models.ForeignKey(Alert, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.patient} - {self.risk_category}"

