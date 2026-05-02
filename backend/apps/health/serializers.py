from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from apps.health.models import EmergencyRequest, SymptomRecord, VitalSign

User = get_user_model()


def validate_zero_to_ten(value, field_name):
    if value is not None and not 0 <= value <= 10:
        raise serializers.ValidationError(f"{field_name} must be between 0 and 10.")
    return value


class VitalSignSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role=User.Role.PATIENT), required=False)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)

    class Meta:
        model = VitalSign
        fields = [
            "id",
            "patient",
            "patient_name",
            "recorded_by",
            "temperature",
            "heart_rate",
            "oxygen_level",
            "systolic_bp",
            "diastolic_bp",
            "pain_level",
            "fatigue_level",
            "appetite_level",
            "recorded_at",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "patient_name", "recorded_by", "created_at"]

    def validate_temperature(self, value):
        if value is not None and not 30 <= float(value) <= 45:
            raise serializers.ValidationError("Temperature must be between 30 and 45 Celsius.")
        return value

    def validate_heart_rate(self, value):
        if value is not None and not 30 <= value <= 220:
            raise serializers.ValidationError("Heart rate must be between 30 and 220.")
        return value

    def validate_oxygen_level(self, value):
        if value is not None and not 0 <= value <= 100:
            raise serializers.ValidationError("Oxygen level must be between 0 and 100.")
        return value

    def validate_systolic_bp(self, value):
        if value is not None and not 60 <= value <= 260:
            raise serializers.ValidationError("Systolic BP must be between 60 and 260.")
        return value

    def validate_diastolic_bp(self, value):
        if value is not None and not 40 <= value <= 180:
            raise serializers.ValidationError("Diastolic BP must be between 40 and 180.")
        return value

    def validate_pain_level(self, value):
        return validate_zero_to_ten(value, "Pain level")

    def validate_fatigue_level(self, value):
        return validate_zero_to_ten(value, "Fatigue level")

    def validate_appetite_level(self, value):
        return validate_zero_to_ten(value, "Appetite level")

    def validate_recorded_at(self, value):
        if value > timezone.now():
            raise serializers.ValidationError("Recorded time cannot be in the future.")
        return value


class SymptomRecordSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role=User.Role.PATIENT), required=False)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)

    class Meta:
        model = SymptomRecord
        fields = [
            "id",
            "patient",
            "patient_name",
            "recorded_by",
            "symptom_date",
            "fever",
            "nausea",
            "vomiting",
            "severe_pain",
            "breathing_difficulty",
            "dizziness",
            "bleeding",
            "fatigue",
            "appetite_loss",
            "infection_signs",
            "symptom_severity_score",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "patient_name", "recorded_by", "created_at"]

    def validate_symptom_severity_score(self, value):
        return validate_zero_to_ten(value, "Symptom severity")

    def validate_symptom_date(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("Symptom date cannot be in the future.")
        return value


class EmergencyRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)

    class Meta:
        model = EmergencyRequest
        fields = [
            "id",
            "patient",
            "patient_name",
            "triggered_by",
            "emergency_type",
            "message",
            "status",
            "created_at",
            "acknowledged_by",
            "resolved_at",
        ]
        read_only_fields = ["id", "patient", "patient_name", "triggered_by", "created_at", "acknowledged_by", "resolved_at"]
