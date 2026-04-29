from django.contrib import admin

from apps.medications.models import Medication, MedicationLog


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ("medicine_name", "patient", "frequency_type", "is_active")
    list_filter = ("frequency_type", "is_active")
    search_fields = ("medicine_name", "patient__email")


@admin.register(MedicationLog)
class MedicationLogAdmin(admin.ModelAdmin):
    list_display = ("medication", "patient", "scheduled_datetime", "status")
    list_filter = ("status",)

