from rest_framework import serializers

from apps.appointments.models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient",
            "title",
            "appointment_type",
            "hospital_name",
            "doctor_name",
            "date",
            "time",
            "notes",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "patient", "created_at"]

