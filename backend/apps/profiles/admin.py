from django.contrib import admin

from apps.profiles.models import CaregiverProfile, PatientProfile


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "age", "cancer_type", "treatment_stage")
    search_fields = ("user__full_name", "user__email", "cancer_type")


@admin.register(CaregiverProfile)
class CaregiverProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "relationship_to_patient", "phone")
    search_fields = ("user__full_name", "user__email", "phone")

