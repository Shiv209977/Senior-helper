from django.contrib import admin

from apps.ai_assessment.models import AIRiskAssessment


@admin.register(AIRiskAssessment)
class AIRiskAssessmentAdmin(admin.ModelAdmin):
    list_display = ("patient", "risk_category", "risk_score", "model_version", "created_at")
    list_filter = ("risk_category", "model_version")
    search_fields = ("patient__email", "patient__full_name")

