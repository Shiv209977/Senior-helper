from django.contrib import admin

from apps.health.models import EmergencyRequest, SymptomRecord, VitalSign


@admin.register(VitalSign)
class VitalSignAdmin(admin.ModelAdmin):
    list_display = ("patient", "recorded_at", "temperature", "heart_rate", "oxygen_level", "pain_level")
    list_filter = ("recorded_at",)


@admin.register(SymptomRecord)
class SymptomRecordAdmin(admin.ModelAdmin):
    list_display = ("patient", "symptom_date", "fever", "breathing_difficulty", "bleeding", "symptom_severity_score")
    list_filter = ("fever", "breathing_difficulty", "bleeding")


@admin.register(EmergencyRequest)
class EmergencyRequestAdmin(admin.ModelAdmin):
    list_display = ("patient", "status", "created_at", "acknowledged_by")
    list_filter = ("status",)

