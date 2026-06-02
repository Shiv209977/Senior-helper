import requests
from django.conf import settings


PRIMARY_MODEL = "openai/gpt-oss-120b:free"
FALLBACK_MODEL = "openrouter/optimus-alpha:free"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def call_openrouter(messages: list[dict], model: str = PRIMARY_MODEL) -> str:
    """Send a chat-completion request to OpenRouter.

    Returns the raw LLM string.  Falls back to *FALLBACK_MODEL* when the
    primary returns a non-200 status.  Raises on hard network errors.
    """
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Lifeway Cancer Support",
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
    }

    resp = requests.post(OPENROUTER_URL, json=payload, headers=headers, timeout=30)

    if resp.status_code != 200 and model == PRIMARY_MODEL:
        return call_openrouter(messages, FALLBACK_MODEL)

    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]
