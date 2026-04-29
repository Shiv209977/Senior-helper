from django.contrib import admin

from apps.linking.models import CaregiverLink


@admin.register(CaregiverLink)
class CaregiverLinkAdmin(admin.ModelAdmin):
    list_display = ("patient", "caregiver", "status", "invite_code", "created_at")
    list_filter = ("status",)
    search_fields = ("patient__email", "caregiver__email", "invite_code")

