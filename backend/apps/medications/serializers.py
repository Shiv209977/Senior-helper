from django.utils import timezone
from rest_framework import serializers

from apps.medications.models import Medication, MedicationLog


class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = [
            "id",
            "patient",
            "medicine_name",
            "dosage",
            "frequency_type",
            "scheduled_times",
            "start_date",
            "end_date",
            "grace_period_minutes",
            "instructions",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "patient", "created_at"]

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if end_date and start_date and end_date < start_date:
            raise serializers.ValidationError("End date cannot be before start date.")
        return attrs


class MedicationLogSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source="medication.medicine_name", read_only=True)

    class Meta:
        model = MedicationLog
        fields = [
            "id",
            "medication",
            "medication_name",
            "patient",
            "scheduled_datetime",
            "status",
            "marked_at",
            "notes",
        ]
        read_only_fields = ["id", "patient", "marked_at", "medication_name"]

    def validate_medication(self, medication):
        request = self.context["request"]
        if request.user.role == "patient" and medication.patient != request.user:
            raise serializers.ValidationError("This medication is not yours.")
        return medication

    def update(self, instance, validated_data):
        if "status" in validated_data:
            validated_data["marked_at"] = timezone.now()
        return super().update(instance, validated_data)

