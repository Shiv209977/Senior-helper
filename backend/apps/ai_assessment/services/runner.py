from apps.ai_assessment.models import AIRiskAssessment
from apps.ai_assessment.services.feature_builder import build_features_for_patient
from apps.ai_assessment.services.ml_predictor import predict_with_model
from apps.ai_assessment.services.rule_engine import score_features
from apps.notifications.services import create_alert_for_patient


def _rank(category):
    return {"low": 1, "medium": 2, "high": 3, "emergency": 4}.get(category, 0)


def run_assessment_for_patient(patient, requested_by, extra_flags=None):
    """Build and persist an AIRiskAssessment from the patient's latest data.

    extra_flags: optional dict of {flag: True} from LLM notes analysis that
    overrides/supplements the checkbox-derived values in features.
    """
    features = build_features_for_patient(patient)
    if extra_flags:
        for flag, value in extra_flags.items():
            if flag in features and value:
                features[flag] = True
    rule_result = score_features(features)
    ml_result = predict_with_model(features)

    final = dict(rule_result)
    if ml_result and _rank(ml_result["risk_category"]) > _rank(rule_result["risk_category"]):
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

    return AIRiskAssessment.objects.create(
        patient=patient,
        requested_by=requested_by,
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
