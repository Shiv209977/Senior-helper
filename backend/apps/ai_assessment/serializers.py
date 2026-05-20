from rest_framework import serializers

from apps.ai_assessment.models import AIRiskAssessment


class AIRiskAssessmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    requested_by_name = serializers.CharField(source="requested_by.full_name", read_only=True)
    confidence_explanation = serializers.SerializerMethodField()
    freshness_warnings = serializers.SerializerMethodField()
    risk_trend = serializers.SerializerMethodField()

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
            "confidence_explanation",
            "freshness_warnings",
            "risk_trend",
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

    def get_confidence_explanation(self, obj):
        from apps.ai_assessment.services.explanation_builder import build_confidence_explanation
        return build_confidence_explanation(obj.input_snapshot, float(obj.confidence) if obj.confidence else None)

    def get_freshness_warnings(self, obj):
        from apps.ai_assessment.services.explanation_builder import get_data_freshness_warnings
        return get_data_freshness_warnings(obj.input_snapshot)

    def get_risk_trend(self, obj):
        from apps.ai_assessment.services.explanation_builder import get_risk_trend
        trend = get_risk_trend({"risk_score": obj.risk_score, "assessment_id": obj.id}, obj.patient)
        if trend:
            return trend
        return {"direction": "first", "message": "This is the first risk assessment. Run more checks to see trends.", "previous_score": None, "previous_category": None}




class RunAssessmentSerializer(serializers.Serializer):
    patient = serializers.IntegerField(required=False)

