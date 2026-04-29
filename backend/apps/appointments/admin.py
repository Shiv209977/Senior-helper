from django.contrib import admin

from apps.appointments.models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("title", "patient", "appointment_type", "date", "time", "status")
    list_filter = ("appointment_type", "status")
    search_fields = ("title", "patient__email", "hospital_name")

