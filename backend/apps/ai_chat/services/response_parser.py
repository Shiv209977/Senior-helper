import json


def parse_dual_output(raw: str) -> dict:
    """Extract structured + response from LLM output.

    Returns safe defaults on parse failure so the caller always gets
    a dict with ``structured`` and ``response`` keys.
    """
    try:
        data = json.loads(raw)
        return {
            "structured": data.get("structured", {}),
            "response": data.get("response", raw),
        }
    except (json.JSONDecodeError, TypeError):
        return {"structured": {}, "response": raw}
