from rest_framework import serializers

from apps.ai_assessment.models import AIRiskAssessment


class AIRiskAssessmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    requested_by_name = serializers.CharField(source="requested_by.full_name", read_only=True)

    class Meta:
        model = AIRiskAssessment
        fields = [
            "id",
            "patient",
            "patient_name",
            "requested_by",
            "requested_by_name",
            "risk_score",
            "risk_category",
            "confidence",
            "reasons",
            "suggested_action",
            "disclaimer",
            "input_snapshot",
            "model_version",
            "rule_score",
            "ml_score",
            "created_alert",
            "created_at",
        ]
        read_only_fields = fields


class RunAssessmentSerializer(serializers.Serializer):
    patient = serializers.IntegerField(required=False)

