from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_chat.models import ChatMessage
from apps.ai_chat.serializers import ChatMessageSerializer, ChatRequestSerializer
from apps.ai_chat.services.openrouter_client import call_openrouter
from apps.ai_chat.services.prompt_builder import build_messages, build_system_prompt
from apps.ai_chat.services.response_parser import parse_dual_output
from apps.ai_assessment.models import AIRiskAssessment
from apps.health.models import EmergencyRequest
from apps.linking.models import CaregiverLink
from apps.notifications.services import create_alert_for_patient, linked_caregivers_for, notify_user

User = get_user_model()

SLIDING_WINDOW = 15
MAX_HISTORY = 50

EMERGENCY_RESPONSE = (
    "I understand you may be experiencing a serious health issue. "
    "Your care team has been alerted and help is on the way. "
    "If you are having difficulty breathing, experiencing severe bleeding, "
    "or feel you are in immediate danger, please call 112 right away. "
    "You are not alone — your caregivers have been notified."
)


def _resolve_patient(user, patient_id):
    """Resolve the target patient from the request."""
    if user.role == "patient":
        if patient_id and int(patient_id) != user.id:
            raise PermissionDenied("Patients can only chat about themselves.")
        return user

    if not patient_id:
        raise ValidationError("patient_id is required for caregivers and admins.")

    patient = User.objects.filter(id=patient_id, role="patient", is_active=True).first()
    if not patient:
        raise ValidationError("Patient not found.")

    if user.role == "admin":
        return patient

    if user.role == "caregiver":
        if CaregiverLink.objects.filter(
            caregiver=user, patient=patient, status=CaregiverLink.Status.ACTIVE
        ).exists():
            return patient
        raise PermissionDenied("You are not linked to this patient.")

    raise PermissionDenied("You are not allowed to access chat.")


def _create_emergency_if_not_active(patient):
    """Create an emergency request if one isn't already active."""
    if EmergencyRequest.objects.filter(patient=patient, status=EmergencyRequest.Status.ACTIVE).exists():
        return
    emergency = EmergencyRequest.objects.create(
        patient=patient,
        triggered_by=patient,
        emergency_type="ai_chat_escalation",
        message="Emergency detected via AI chat analysis.",
    )
    create_alert_for_patient(
        patient=patient,
        alert_type="emergency",
        severity="emergency",
        title="Emergency — AI chat escalation",
        message="The AI chat detected a potential emergency. Immediate attention required.",
        source=emergency,
    )


class ChatMessageView(APIView):
    """POST /api/chat/messages/ — send a chat message and get an AI response."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        content = serializer.validated_data["content"]
        patient_id = serializer.validated_data.get("patient_id")
        patient = _resolve_patient(request.user, patient_id)
        sender = request.user

        # Check for emergency hard-block — only block when an EmergencyRequest is still
        # active, so patients aren't locked out after a past emergency is resolved.
        active_emergency = EmergencyRequest.objects.filter(
            patient=patient, status=EmergencyRequest.Status.ACTIVE
        ).exists()
        latest_assessment = (
            AIRiskAssessment.objects.filter(patient=patient)
            .order_by("-created_at")
            .first()
        )
        if active_emergency and latest_assessment and latest_assessment.risk_category == "emergency":
            # Save the user message
            ChatMessage.objects.create(
                patient=patient, sender=sender, role=ChatMessage.Role.USER, content=content
            )
            # Save the hardcoded assistant message
            ChatMessage.objects.create(
                patient=patient,
                sender=sender,
                role=ChatMessage.Role.ASSISTANT,
                content=EMERGENCY_RESPONSE,
                concern_level=10,
            )
            _create_emergency_if_not_active(patient)
            return Response(
                {
                    "response": EMERGENCY_RESPONSE,
                    "concern_level": 10,
                    "unstructured_notes": "Emergency hard-block triggered.",
                    "modifier_applied": 15,
                },
                status=status.HTTP_200_OK,
            )

        # Build sliding window from last 15 messages
        history_qs = ChatMessage.objects.filter(patient=patient).order_by("-created_at")[:SLIDING_WINDOW]
        history = [{"role": m.role, "content": m.content} for m in reversed(history_qs)]

        system_prompt = build_system_prompt(sender.role)
        messages = build_messages(system_prompt, history, content)

        # Persist the user turn before calling the LLM so it is never lost on failure
        ChatMessage.objects.create(
            patient=patient, sender=sender, role=ChatMessage.Role.USER, content=content
        )

        # Call LLM
        raw = call_openrouter(messages)
        parsed = parse_dual_output(raw)
        structured = parsed.get("structured", {})
        response_text = parsed.get("response", raw)

        concern_level = structured.get("concern_level")
        if concern_level is not None:
            try:
                concern_level = max(0, min(10, int(concern_level)))
            except (TypeError, ValueError):
                concern_level = None

        unstructured_notes = structured.get("unstructured_notes", "")

        # Build extracted_flags from structured output
        extracted_flags = {
            k: structured.get(k, False)
            for k in [
                "fever", "nausea", "vomiting", "breathing_difficulty",
                "dizziness", "bleeding", "fatigue", "appetite_loss", "infection_signs",
            ]
        }
        extracted_flags["concern_level"] = concern_level
        extracted_flags["unstructured_notes"] = unstructured_notes

        # Compute modifier
        modifier_applied = 0
        if concern_level is not None:
            modifier_applied = min(int(concern_level * 1.5), 15)

        # Auto-escalate on critical LLM-detected symptoms
        is_critical = extracted_flags.get("bleeding") or extracted_flags.get("breathing_difficulty")
        is_high_concern = concern_level is not None and concern_level >= 8
        if is_critical or is_high_concern:
            if is_critical:
                _create_emergency_if_not_active(patient)
            try:
                from apps.ai_assessment.services.runner import run_assessment_for_patient
                run_assessment_for_patient(patient, sender)
            except Exception:
                pass

        # Save assistant message
        ChatMessage.objects.create(
            patient=patient,
            sender=sender,
            role=ChatMessage.Role.ASSISTANT,
            content=response_text,
            extracted_flags=extracted_flags,
            concern_level=concern_level,
            unstructured_notes=unstructured_notes,
        )

        return Response(
            {
                "response": response_text,
                "concern_level": concern_level,
                "unstructured_notes": unstructured_notes,
                "modifier_applied": modifier_applied,
            },
            status=status.HTTP_200_OK,
        )


class ChatHistoryView(APIView):
    """GET /api/chat/history/ — retrieve chat history for a patient."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        patient_id = request.query_params.get("patient_id")
        patient = _resolve_patient(request.user, patient_id)
        messages = ChatMessage.objects.filter(patient=patient).order_by("-created_at")[:MAX_HISTORY]
        data = ChatMessageSerializer(reversed(list(messages)), many=True).data
        return Response(data)


class DigestView(APIView):
    """POST /api/chat/digest/ — generate a caregiver digest and send as notification."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role not in ("caregiver", "admin"):
            raise PermissionDenied("Only caregivers or admins can request digests.")

        patient_id = request.data.get("patient_id")
        if not patient_id:
            raise ValidationError("patient_id is required.")

        patient = _resolve_patient(request.user, patient_id)

        from apps.ai_chat.services.digest_builder import build_caregiver_digest

        try:
            digest = build_caregiver_digest(patient)
        except Exception as exc:
            return Response(
                {"error": "Could not generate digest. The AI service may be temporarily unavailable."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        for cg in linked_caregivers_for(patient):
            notify_user(cg, f"Digest: {patient.full_name}", digest, notification_type="alert:ai")

        return Response({"message": "Digest sent to caregivers."}, status=status.HTTP_200_OK)


_LLM_NOTES_CACHE_KEY = "llm_notes_analysis_enabled"


class DemoSettingsView(APIView):
    """GET/POST /api/settings/demo/ — read or toggle demo feature flags. Admin only."""

    permission_classes = [permissions.IsAuthenticated]

    def _require_admin(self, user):
        if user.role != "admin":
            raise PermissionDenied("Only admins can change demo settings.")

    def get(self, request):
        self._require_admin(request.user)
        return Response({
            "llm_notes_analysis": cache.get(_LLM_NOTES_CACHE_KEY, False),
        })

    def post(self, request):
        self._require_admin(request.user)
        current = cache.get(_LLM_NOTES_CACHE_KEY, False)
        new_value = not current
        cache.set(_LLM_NOTES_CACHE_KEY, new_value, timeout=None)
        return Response({
            "llm_notes_analysis": new_value,
        })
