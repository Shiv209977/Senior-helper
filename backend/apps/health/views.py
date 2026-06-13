from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from rest_framework import decorators, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.audit.services import log_action
from apps.health.models import EmergencyRequest, SymptomRecord, VitalSign
from apps.health.serializers import EmergencyRequestSerializer, SymptomRecordSerializer, VitalSignSerializer
from apps.linking.models import CaregiverLink
from apps.notifications.services import create_alert_for_patient

User = get_user_model()


def caregiver_can_access(user, patient):
    return CaregiverLink.objects.filter(caregiver=user, patient=patient, status=CaregiverLink.Status.ACTIVE).exists()


def patient_queryset_for(user, queryset):
    if user.role == "admin":
        return queryset
    if user.role == "patient":
        return queryset.filter(patient=user)
    if user.role == "caregiver":
        patient_ids = CaregiverLink.objects.filter(caregiver=user, status=CaregiverLink.Status.ACTIVE).values_list("patient_id", flat=True)
        return queryset.filter(patient_id__in=patient_ids)
    return queryset.none()


def resolve_record_patient(user, requested_patient):
    if user.role == "patient":
        if requested_patient and requested_patient != user:
            raise PermissionDenied("Patients can only add records for themselves.")
        return user

    if user.role == "admin":
        if not requested_patient:
            raise ValidationError("patient is required.")
        if requested_patient.role != User.Role.PATIENT or not requested_patient.is_active:
            raise ValidationError("Patient not found.")
        return requested_patient

    if user.role == "caregiver":
        if not requested_patient:
            raise ValidationError("patient is required.")
        if caregiver_can_access(user, requested_patient):
            return requested_patient
        raise PermissionDenied("Caregivers can only add records for linked patients.")

    raise PermissionDenied("You are not allowed to add records.")


def create_vitals_alerts(vital):
    if vital.oxygen_level is not None and vital.oxygen_level < 92:
        create_alert_for_patient(vital.patient, "vitals", "high", "Low oxygen level", "Oxygen level is below the safe demo threshold.", vital)
    if vital.temperature is not None and float(vital.temperature) >= 38.5:
        create_alert_for_patient(vital.patient, "vitals", "medium", "High temperature", "Temperature is higher than expected.", vital)
    if vital.pain_level >= 8:
        create_alert_for_patient(vital.patient, "vitals", "high", "Severe pain reported", "Pain level is high and needs caregiver attention.", vital)


def create_symptom_alerts(record):
    if record.breathing_difficulty or record.bleeding:
        create_alert_for_patient(record.patient, "symptom", "emergency", "Emergency symptom reported", "Breathing difficulty or bleeding was reported.", record)
    elif record.severe_pain or (record.fever and record.infection_signs):
        create_alert_for_patient(record.patient, "symptom", "high", "High-risk symptoms reported", "Symptoms may need caregiver attention soon.", record)


class VitalSignViewSet(viewsets.ModelViewSet):
    serializer_class = VitalSignSerializer

    def get_queryset(self):
        return patient_queryset_for(self.request.user, VitalSign.objects.select_related("patient", "recorded_by"))

    def perform_create(self, serializer):
        patient = resolve_record_patient(self.request.user, serializer.validated_data.pop("patient", None))
        vital = serializer.save(patient=patient, recorded_by=self.request.user)
        create_vitals_alerts(vital)
        log_action(user=self.request.user, action="vitals_created", metadata={"vital_id": vital.id})
        notes_flags = {}
        use_llm = cache.get("llm_notes_analysis_enabled", False) and not self.request.user.fast_mode
        if vital.notes and vital.notes.strip() and use_llm:
            try:
                from apps.ai_chat.services.notes_analyzer import analyze_notes
                notes_flags = analyze_notes(vital.notes)
            except Exception:
                pass
        try:
            from apps.ai_assessment.services.runner import run_assessment_for_patient
            run_assessment_for_patient(patient, self.request.user, extra_flags=notes_flags)
        except Exception:
            pass


class SymptomRecordViewSet(viewsets.ModelViewSet):
    serializer_class = SymptomRecordSerializer

    def get_queryset(self):
        return patient_queryset_for(self.request.user, SymptomRecord.objects.select_related("patient", "recorded_by"))

    def perform_create(self, serializer):
        patient = resolve_record_patient(self.request.user, serializer.validated_data.pop("patient", None))
        record = serializer.save(patient=patient, recorded_by=self.request.user)
        create_symptom_alerts(record)
        log_action(user=self.request.user, action="symptoms_created", metadata={"symptom_id": record.id})
        # Create emergency for life-threatening symptom flags
        if record.bleeding or record.breathing_difficulty:
            if not EmergencyRequest.objects.filter(patient=patient, status=EmergencyRequest.Status.ACTIVE).exists():
                emergency = EmergencyRequest.objects.create(
                    patient=patient,
                    triggered_by=self.request.user,
                    emergency_type="symptom_escalation",
                    message="Critical symptoms logged: bleeding or breathing difficulty.",
                )
                create_alert_for_patient(
                    patient=patient,
                    alert_type="emergency",
                    severity="emergency",
                    title="Emergency — critical symptoms logged",
                    message="Patient logged bleeding or breathing difficulty.",
                    source=emergency,
                )
        notes_flags = {}
        use_llm = cache.get("llm_notes_analysis_enabled", False) and not self.request.user.fast_mode
        if record.notes and record.notes.strip() and use_llm:
            try:
                from apps.ai_chat.services.notes_analyzer import analyze_notes
                notes_flags = analyze_notes(record.notes)
            except Exception:
                pass
        # Notes-detected bleeding/breathing_difficulty also triggers emergency
        if not (record.bleeding or record.breathing_difficulty):
            if notes_flags.get("bleeding") or notes_flags.get("breathing_difficulty"):
                if not EmergencyRequest.objects.filter(patient=patient, status=EmergencyRequest.Status.ACTIVE).exists():
                    emergency = EmergencyRequest.objects.create(
                        patient=patient,
                        triggered_by=self.request.user,
                        emergency_type="symptom_escalation",
                        message="Critical symptoms detected in symptom notes.",
                    )
                    create_alert_for_patient(
                        patient=patient,
                        alert_type="emergency",
                        severity="emergency",
                        title="Emergency — critical symptoms in notes",
                        message="AI detected bleeding or breathing difficulty in patient's notes.",
                        source=emergency,
                    )
        try:
            from apps.ai_assessment.services.runner import run_assessment_for_patient
            run_assessment_for_patient(patient, self.request.user, extra_flags=notes_flags)
        except Exception:
            pass


class EmergencyRequestViewSet(viewsets.ModelViewSet):
    serializer_class = EmergencyRequestSerializer

    def get_queryset(self):
        return patient_queryset_for(self.request.user, EmergencyRequest.objects.select_related("patient", "triggered_by", "acknowledged_by"))

    def perform_create(self, serializer):
        if self.request.user.role != "patient":
            raise PermissionDenied("Only patients can trigger emergency requests in this demo build.")
        active_exists = EmergencyRequest.objects.filter(patient=self.request.user, status=EmergencyRequest.Status.ACTIVE).exists()
        if active_exists:
            raise ValidationError("There is already an active emergency request.")
        emergency = serializer.save(patient=self.request.user, triggered_by=self.request.user)
        create_alert_for_patient(
            patient=self.request.user,
            alert_type="emergency",
            severity="emergency",
            title="Emergency request",
            message=emergency.message or "Patient requested urgent help.",
            source=emergency,
        )
        log_action(user=self.request.user, action="emergency_created", metadata={"emergency_id": emergency.id})

    @decorators.action(detail=True, methods=["post"])
    def acknowledge(self, request, pk=None):
        emergency = self.get_object()
        if request.user.role not in ["caregiver", "admin"]:
            raise PermissionDenied("Only caregivers or admins can acknowledge emergency requests.")
        emergency.status = EmergencyRequest.Status.ACKNOWLEDGED
        emergency.acknowledged_by = request.user
        emergency.save(update_fields=["status", "acknowledged_by"])
        return Response(EmergencyRequestSerializer(emergency).data)

    @decorators.action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        emergency = self.get_object()
        if request.user.role not in ["caregiver", "admin"]:
            raise PermissionDenied("Only caregivers or admins can resolve emergency requests.")
        emergency.status = EmergencyRequest.Status.RESOLVED
        emergency.resolved_at = timezone.now()
        emergency.save(update_fields=["status", "resolved_at"])
        return Response(EmergencyRequestSerializer(emergency).data)
