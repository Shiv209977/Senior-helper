DISCLAIMER = (
    "This AI result is only a supportive risk assessment based on entered data. "
    "It is not a medical diagnosis and should not replace advice from a qualified doctor."
)


def category_from_score(score):
    if score >= 76:
        return "emergency"
    if score >= 51:
        return "high"
    if score >= 26:
        return "medium"
    return "low"


def suggested_action_for(category):
    return {
        "low": "Continue routine monitoring and follow your existing care plan.",
        "medium": "Inform your caregiver and monitor symptoms closely.",
        "high": "Caregiver should check the patient soon and consider contacting the doctor.",
        "emergency": "Immediate caregiver attention is required. Contact doctor or emergency support if symptoms are severe.",
    }[category]


def score_features(features):
    score = 0
    reasons = []

    oxygen = features.get("oxygen_level")
    if oxygen is not None and oxygen < 92:
        score += 30
        reasons.append("Oxygen level is lower than the safe demo threshold.")

    temperature = features.get("temperature")
    if temperature is not None and temperature >= 38.5:
        score += 18
        reasons.append("High temperature was recorded.")

    heart_rate = features.get("heart_rate")
    if heart_rate is not None and heart_rate >= 120:
        score += 12
        reasons.append("Heart rate is higher than expected.")

    if features.get("pain_level", 0) >= 8:
        score += 20
        reasons.append("Severe pain level was recorded.")

    if features.get("fatigue_level", 0) >= 8:
        score += 10
        reasons.append("Fatigue level is high.")

    if features.get("appetite_level", 5) <= 2:
        score += 8
        reasons.append("Appetite level is very low.")

    if features.get("fever"):
        score += 10
        reasons.append("Fever was reported in symptoms.")

    if features.get("vomiting"):
        score += 8
        reasons.append("Vomiting was reported.")

    if features.get("infection_signs"):
        score += 15
        reasons.append("Signs of infection were reported.")

    if features.get("breathing_difficulty"):
        score += 45
        reasons.append("Breathing difficulty was reported.")

    if features.get("bleeding"):
        score += 45
        reasons.append("Bleeding was reported.")

    missed_med = features.get("missed_med_24h", 0)
    if missed_med:
        score += min(20, missed_med * 8)
        reasons.append(f"{missed_med} medication dose(s) were missed in the last 24 hours.")

    missed_appt = features.get("missed_appt_30d", 0)
    if missed_appt:
        score += min(12, missed_appt * 6)
        reasons.append(f"{missed_appt} appointment(s) were missed in the last 30 days.")

    emergency_count = features.get("emergency_30d", 0)
    if emergency_count:
        score += min(16, emergency_count * 8)
        reasons.append("Recent emergency request history is present.")

    if not reasons:
        reasons.append("No high-risk symptoms or abnormal vitals were found in the latest records.")

    score = min(100, score)
    category = category_from_score(score)
    if features.get("breathing_difficulty") or features.get("bleeding") or (oxygen is not None and oxygen < 88):
        category = "emergency"
        score = max(score, 80)

    return {
        "risk_score": score,
        "risk_category": category,
        "reasons": reasons[:5],
        "suggested_action": suggested_action_for(category),
        "disclaimer": DISCLAIMER,
        "model_version": "rule-based-v1",
        "rule_score": score,
        "confidence": 0.70 if features.get("has_vitals") and features.get("has_symptoms") else 0.45,
    }

