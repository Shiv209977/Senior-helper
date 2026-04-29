from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from apps.appointments.models import Appointment
from apps.appointments.serializers import AppointmentSerializer
from apps.audit.services import log_action
from apps.linking.models import CaregiverLink
from apps.notifications.services import create_alert_for_patient


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.select_related("patient")
        if user.role == "admin":
            return queryset
        if user.role == "patient":
            return queryset.filter(patient=user)
        if user.role == "caregiver":
            patient_ids = CaregiverLink.objects.filter(caregiver=user, status=CaregiverLink.Status.ACTIVE).values_list("patient_id", flat=True)
            return queryset.filter(patient_id__in=patient_ids)
        return queryset.none()

    def perform_create(self, serializer):
        if self.request.user.role != "patient":
            raise PermissionDenied("Only patients can create appointments.")
        appointment = serializer.save(patient=self.request.user)
        log_action(user=self.request.user, action="appointment_created", metadata={"appointment_id": appointment.id})

    def perform_update(self, serializer):
        appointment = self.get_object()
        if self.request.user.role != "patient" or appointment.patient != self.request.user:
            raise PermissionDenied("Only the patient can update this appointment.")
        old_status = appointment.status
        updated = serializer.save()
        if updated.status == Appointment.Status.MISSED and old_status != Appointment.Status.MISSED:
            create_alert_for_patient(
                patient=updated.patient,
                alert_type="appointment",
                severity="medium",
                title="Missed appointment",
                message=f"{updated.title} was marked as missed.",
                source=updated,
            )

