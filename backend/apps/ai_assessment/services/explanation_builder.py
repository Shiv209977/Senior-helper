from datetime import datetime, timedelta

from django.utils import timezone


def _parse_datetime(value):
    if value is None:
        return None
    if isinstance(value, str):
        try:
            return timezone.make_aware(datetime.fromisoformat(value))
        except (ValueError, TypeError):
            return None
    return value


def build_confidence_explanation(features, confidence):
    reasons = []
    has_vitals = features.get("has_vitals", False)
    has_symptoms = features.get("has_symptoms", False)

    if confidence is not None and confidence >= 0.65:
        reasons.append("Confidence is higher because both recent vitals and symptoms were found.")
    else:
        if not has_vitals:
            reasons.append("Confidence is low because no recent vitals were found.")
        if not has_symptoms:
            reasons.append("Confidence is low because no recent symptom records were found.")
        if not has_vitals and not has_symptoms:
            reasons.append("Confidence is very low because neither vitals nor symptoms are available. Enter both for a better risk check.")
    return reasons


def get_data_freshness_warnings(features):
    now = timezone.now()
    warnings = []

    latest_vitals_at = _parse_datetime(features.get("latest_vitals_at"))
    if latest_vitals_at:
        if now - latest_vitals_at > timedelta(hours=24):
            warnings.append("Latest vitals are older than 24 hours. The risk check may not reflect your current condition.")
    else:
        warnings.append("No vitals records found. Add vitals for a more accurate risk check.")

    latest_symptoms_at = _parse_datetime(features.get("latest_symptoms_at"))
    if latest_symptoms_at:
        if now - latest_symptoms_at > timedelta(days=3):
            warnings.append("Latest symptoms are older than 3 days. Consider adding new symptom records.")
    else:
        warnings.append("No symptom records found. Add symptoms for a more accurate risk check.")

    if features.get("missed_med_24h", -1) < 0 and features.get("has_vitals"):
        warnings.append("No medication logs found in the recent data. Regular medication tracking improves risk assessment accuracy.")

    return warnings


def get_risk_trend(current_score, patient):
    from apps.ai_assessment.models import AIRiskAssessment

    previous = AIRiskAssessment.objects.filter(patient=patient).exclude(id=current_score.get("assessment_id", 0)).order_by("-created_at").first()
    if not previous:
        return None

    diff = current_score["risk_score"] - previous.risk_score
    if diff > 10:
        return {
            "direction": "worsening",
            "message": f"Risk increased by {diff} points since the last check. Caregiver attention may be needed.",
            "previous_score": previous.risk_score,
            "previous_category": previous.risk_category,
        }
    if diff < -5:
        return {
            "direction": "improving",
            "message": f"Risk improved by {abs(diff)} points since the last check.",
            "previous_score": previous.risk_score,
            "previous_category": previous.risk_category,
        }
    return {
        "direction": "stable",
        "message": "Risk is similar to the previous check.",
        "previous_score": previous.risk_score,
        "previous_category": previous.risk_category,
    }
