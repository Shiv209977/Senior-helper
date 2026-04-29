from rest_framework import serializers

from apps.profiles.models import CaregiverProfile, PatientProfile


class PatientProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = PatientProfile
        fields = [
            "id",
            "user",
            "full_name",
            "email",
            "age",
            "gender",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "cancer_type",
            "treatment_stage",
            "primary_hospital",
            "doctor_name",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "full_name", "email", "created_at", "updated_at"]

    def validate_age(self, value):
        if value is not None and not 1 <= value <= 120:
            raise serializers.ValidationError("Age must be between 1 and 120.")
        return value


class CaregiverProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = CaregiverProfile
        fields = [
            "id",
            "user",
            "full_name",
            "email",
            "relationship_to_patient",
            "phone",
            "address",
            "availability_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "full_name", "email", "created_at", "updated_at"]

