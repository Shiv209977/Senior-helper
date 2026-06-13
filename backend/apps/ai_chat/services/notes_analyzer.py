import json

from apps.ai_chat.services.openrouter_client import call_openrouter

_PROMPT = """\
You are a medical symptom extractor for an elderly cancer patient care app.
Given a patient's free-text health note, identify which symptoms are mentioned \
or strongly implied — including indirect language like "feels like I'm drowning" \
(breathing_difficulty) or "haven't eaten anything today" (appetite_loss).

Patient note: "{notes}"

Respond ONLY with a valid JSON object. Set a key to true only if that symptom \
is present or clearly implied. Never add explanation outside the JSON.

{{
  "fever": false,
  "vomiting": false,
  "bleeding": false,
  "breathing_difficulty": false,
  "infection_signs": false,
  "severe_pain": false,
  "fatigue": false,
  "appetite_loss": false
}}"""

_FLAG_KEYS = {
    "fever", "vomiting", "bleeding", "breathing_difficulty",
    "infection_signs", "severe_pain", "fatigue", "appetite_loss",
}


def analyze_notes(notes_text: str) -> dict:
    """
    Call the LLM to extract symptom flags from free-text notes.
    Returns a dict of {flag: True} for detected symptoms.
    Falls back to empty dict if the LLM call fails or returns unparseable output.
    """
    if not notes_text or not notes_text.strip():
        return {}

    prompt = _PROMPT.format(notes=notes_text.replace('"', "'"))
    messages = [{"role": "user", "content": prompt}]

    try:
        raw = call_openrouter(messages)
        # Strip markdown code fences if model wraps in ```json ... ```
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        data = json.loads(cleaned)
        return {k: True for k, v in data.items() if k in _FLAG_KEYS and v is True}
    except Exception:
        return {}
