from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.ai_assessment.models import AIRiskAssessment
from apps.ai_assessment.serializers import AIRiskAssessmentSerializer, RunAssessmentSerializer
from apps.ai_assessment.services.feature_builder import build_features_for_patient
from apps.ai_assessment.services.ml_predictor import predict_with_model
from apps.ai_assessment.services.rule_engine import score_features
from apps.linking.models import CaregiverLink
from apps.notifications.services import create_alert_for_patient

User = get_user_model()


def category_rank(category):
    return {"low": 1, "medium": 2, "high": 3, "emergency": 4}[category]


class AIRiskAssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AIRiskAssessmentSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = AIRiskAssessment.objects.select_related("patient", "requested_by", "created_alert")
        if user.role == "admin":
            return queryset
        if user.role == "patient":
            return queryset.filter(patient=user)
        if user.role == "caregiver":
            linked_ids = CaregiverLink.objects.filter(caregiver=user, status=CaregiverLink.Status.ACTIVE).values_list("patient_id", flat=True)
            return queryset.filter(patient_id__in=linked_ids)
        return queryset.none()

    def create(self, request, *args, **kwargs):
        serializer = RunAssessmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient = self.resolve_patient(serializer.validated_data.get("patient"))
        features = build_features_for_patient(patient)
        rule_result = score_features(features)
        ml_result = predict_with_model(features)

        final = dict(rule_result)
        if ml_result and category_rank(ml_result["risk_category"]) > category_rank(rule_result["risk_category"]):
            final["risk_category"] = ml_result["risk_category"]
            final["risk_score"] = max(rule_result["risk_score"], ml_result["risk_score"])
            final["model_version"] = ml_result["model_version"]
            final["ml_score"] = ml_result["risk_score"]
        else:
            final["ml_score"] = ml_result["risk_score"] if ml_result else None

        created_alert = None
        if final["risk_category"] in ["high", "emergency"]:
            alerts = create_alert_for_patient(
                patient=patient,
                alert_type="ai",
                severity=final["risk_category"],
                title=f"AI risk assessment: {final['risk_category'].title()}",
                message=final["suggested_action"],
            )
            created_alert = alerts[0] if alerts else None

        assessment = AIRiskAssessment.objects.create(
            patient=patient,
            requested_by=request.user,
            risk_score=final["risk_score"],
            risk_category=final["risk_category"],
            confidence=final["confidence"],
            reasons=final["reasons"],
            suggested_action=final["suggested_action"],
            disclaimer=final["disclaimer"],
            input_snapshot=features,
            model_version=final["model_version"],
            rule_score=rule_result["rule_score"],
            ml_score=final["ml_score"],
            created_alert=created_alert,
        )
        return Response(AIRiskAssessmentSerializer(assessment).data, status=status.HTTP_201_CREATED)

    def resolve_patient(self, patient_id):
        user = self.request.user
        if user.role == "patient":
            if patient_id and int(patient_id) != user.id:
                raise PermissionDenied("Patients can only assess themselves.")
            return user

        if not patient_id:
            raise ValidationError("patient is required for caregivers and admins.")
        patient = User.objects.filter(id=patient_id, role="patient", is_active=True).first()
        if not patient:
            raise ValidationError("Patient not found.")
        if user.role == "admin":
            return patient
        if user.role == "caregiver" and CaregiverLink.objects.filter(caregiver=user, patient=patient, status=CaregiverLink.Status.ACTIVE).exists():
            return patient
        raise PermissionDenied("You are not allowed to assess this patient.")

