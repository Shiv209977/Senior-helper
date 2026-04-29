from django.db.models import Q
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from apps.audit.services import log_action
from apps.linking.models import CaregiverLink
from apps.medications.models import Medication, MedicationLog
from apps.medications.serializers import MedicationLogSerializer, MedicationSerializer
from apps.notifications.services import create_alert_for_patient


def linked_patient_filter(user):
    return CaregiverLink.objects.filter(caregiver=user, status=CaregiverLink.Status.ACTIVE).values_list("patient_id", flat=True)


class MedicationViewSet(viewsets.ModelViewSet):
    serializer_class = MedicationSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Medication.objects.select_related("patient")
        if user.role == "admin":
            return queryset
        if user.role == "patient":
            return queryset.filter(patient=user)
        if user.role == "caregiver":
            return queryset.filter(patient_id__in=linked_patient_filter(user))
        return queryset.none()

    def perform_create(self, serializer):
        if self.request.user.role != "patient":
            raise PermissionDenied("Only patients can create medications.")
        medication = serializer.save(patient=self.request.user)
        log_action(user=self.request.user, action="medication_created", metadata={"medication_id": medication.id})

    def perform_update(self, serializer):
        medication = self.get_object()
        if self.request.user.role != "patient" or medication.patient != self.request.user:
            raise PermissionDenied("Only the patient can update this medication.")
        serializer.save()


class MedicationLogViewSet(viewsets.ModelViewSet):
    serializer_class = MedicationLogSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = MedicationLog.objects.select_related("patient", "medication")
        if user.role == "admin":
            return queryset
        if user.role == "patient":
            return queryset.filter(patient=user)
        if user.role == "caregiver":
            return queryset.filter(patient_id__in=linked_patient_filter(user))
        return queryset.none()

    def perform_create(self, serializer):
        medication = serializer.validated_data["medication"]
        if self.request.user.role != "patient" or medication.patient != self.request.user:
            raise PermissionDenied("Only patients can create their own medication logs.")
        log = serializer.save(patient=self.request.user)
        log_action(user=self.request.user, action="medication_log_created", metadata={"log_id": log.id, "status": log.status})
        if log.status == MedicationLog.Status.MISSED:
            create_alert_for_patient(
                patient=log.patient,
                alert_type="medication",
                severity="medium",
                title="Missed medicine",
                message=f"{log.medication.medicine_name} was marked as missed.",
                source=log,
            )

    def perform_update(self, serializer):
        log = self.get_object()
        if self.request.user.role != "patient" or log.patient != self.request.user:
            raise PermissionDenied("Only the patient can update this medication log.")
        old_status = log.status
        updated = serializer.save()
        log_action(user=self.request.user, action="medication_status_changed", metadata={"log_id": log.id, "status": updated.status})
        if updated.status == MedicationLog.Status.MISSED and old_status != MedicationLog.Status.MISSED:
            create_alert_for_patient(
                patient=updated.patient,
                alert_type="medication",
                severity="medium",
                title="Missed medicine",
                message=f"{updated.medication.medicine_name} was marked as missed.",
                source=updated,
            )

