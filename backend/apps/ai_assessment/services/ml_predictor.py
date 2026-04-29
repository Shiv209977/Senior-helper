from pathlib import Path

from django.conf import settings


def predict_with_model(features):
    model_path = Path(settings.BASE_DIR) / "apps" / "ai_assessment" / "ml" / "risk_model.joblib"
    if not model_path.exists():
        return None

    try:
        import joblib

        model = joblib.load(model_path)
        numeric_features = [
            features.get("age") or 0,
            features.get("temperature") or 37.0,
            features.get("heart_rate") or 80,
            features.get("oxygen_level") or 98,
            features.get("systolic_bp") or 120,
            features.get("diastolic_bp") or 80,
            features.get("pain_level") or 0,
            features.get("fatigue_level") or 0,
            features.get("appetite_level") or 5,
            int(features.get("fever")),
            int(features.get("nausea")),
            int(features.get("vomiting")),
            int(features.get("breathing_difficulty")),
            int(features.get("bleeding")),
            int(features.get("infection_signs")),
            features.get("missed_med_24h") or 0,
            features.get("missed_appt_30d") or 0,
            features.get("emergency_30d") or 0,
        ]
        category = model.predict([numeric_features])[0]
        score_map = {"low": 15, "medium": 40, "high": 65, "emergency": 90}
        return {"risk_category": category, "risk_score": score_map.get(category, 40), "model_version": "random-forest-demo-v1"}
    except Exception:
        return None

