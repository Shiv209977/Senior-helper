from rest_framework import serializers

from apps.linking.models import CaregiverLink


class CaregiverLinkSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    caregiver_name = serializers.CharField(source="caregiver.full_name", read_only=True)

    class Meta:
        model = CaregiverLink
        fields = [
            "id",
            "patient",
            "patient_name",
            "caregiver",
            "caregiver_name",
            "invite_code",
            "status",
            "created_at",
            "approved_at",
            "revoked_at",
        ]
        read_only_fields = fields


class AcceptInviteSerializer(serializers.Serializer):
    invite_code = serializers.CharField(max_length=16)

