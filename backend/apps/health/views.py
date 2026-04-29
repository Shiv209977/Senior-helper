from django.utils import timezone
from rest_framework import decorators, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.audit.services import log_action
from apps.health.models import EmergencyRequest, SymptomRecord, VitalSign
from apps.health.serializers import EmergencyRequestSerializer, SymptomRecordSerializer, VitalSignSerializer
from apps.linking.models import CaregiverLink
from apps.notifications.services import create_alert_for_patient


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
        patient = self.request.user
        if self.request.user.role != "patient":
            raise PermissionDenied("Only patients can add their own vitals in this demo build.")
        vital = serializer.save(patient=patient, recorded_by=self.request.user)
        create_vitals_alerts(vital)
        log_action(user=self.request.user, action="vitals_created", metadata={"vital_id": vital.id})


class SymptomRecordViewSet(viewsets.ModelViewSet):
    serializer_class = SymptomRecordSerializer

    def get_queryset(self):
        return patient_queryset_for(self.request.user, SymptomRecord.objects.select_related("patient", "recorded_by"))

    def perform_create(self, serializer):
        if self.request.user.role != "patient":
            raise PermissionDenied("Only patients can add their own symptoms in this demo build.")
        record = serializer.save(patient=self.request.user, recorded_by=self.request.user)
        create_symptom_alerts(record)
        log_action(user=self.request.user, action="symptoms_created", metadata={"symptom_id": record.id})


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

