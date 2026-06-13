from apps.ai_chat.models import ChatMessage
from apps.ai_chat.services.openrouter_client import call_openrouter
from apps.ai_chat.services.prompt_builder import CAREGIVER_SYSTEM_PROMPT, build_messages
from apps.ai_chat.services.response_parser import parse_dual_output


def build_caregiver_digest(patient) -> str:
    """Generate a plain-text clinical digest for the caregiver.

    Pulls the last 20 ChatMessages and the latest AIRiskAssessment for
    *patient*, then summarises via a single OpenRouter call.
    """
    messages_qs = ChatMessage.objects.filter(patient=patient).order_by("-created_at")[:20]
    chat_lines = [
        f"[{m.role}] {m.content}" for m in reversed(messages_qs)
    ]

    # Include latest risk assessment summary if available
    from apps.ai_assessment.models import AIRiskAssessment

    latest = AIRiskAssessment.objects.filter(patient=patient).order_by("-created_at").first()
    risk_line = ""
    if latest:
        risk_line = (
            f"\n\nLatest AI risk assessment: score={latest.risk_score}, "
            f"category={latest.risk_category}, reasons={latest.reasons}, "
            f"suggested_action={latest.suggested_action}"
        )

    user_prompt = (
        "Summarise the following chat history and risk data into a concise clinical "
        "digest for the caregiver. Focus on: current symptoms, risk level, "
        "recommended actions, and any unresolved concerns.\n\n"
        "Chat history:\n" + "\n".join(chat_lines) + risk_line
    )

    llm_messages = build_messages(CAREGIVER_SYSTEM_PROMPT, [], user_prompt)
    raw = call_openrouter(llm_messages)
    parsed = parse_dual_output(raw)
    return parsed.get("response", raw)
