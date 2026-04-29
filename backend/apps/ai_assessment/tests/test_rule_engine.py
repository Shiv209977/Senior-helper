from django.test import SimpleTestCase

from apps.ai_assessment.services.rule_engine import score_features


class RuleEngineTests(SimpleTestCase):
    def test_low_risk_when_inputs_are_normal(self):
        result = score_features({"oxygen_level": 98, "temperature": 37.0, "pain_level": 1, "fatigue_level": 1, "appetite_level": 7})

        self.assertEqual(result["risk_category"], "low")

    def test_emergency_override_for_breathing_difficulty(self):
        result = score_features({"breathing_difficulty": True, "oxygen_level": 98})

        self.assertEqual(result["risk_category"], "emergency")
        self.assertGreaterEqual(result["risk_score"], 80)

