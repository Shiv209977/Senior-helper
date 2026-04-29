from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from apps.audit.services import log_action
from apps.profiles.models import CaregiverProfile, PatientProfile
from apps.profiles.serializers import CaregiverProfileSerializer, PatientProfileSerializer


class PatientProfileViewSet(viewsets.ModelViewSet):
    serializer_class = PatientProfileSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = PatientProfile.objects.select_related("user")
        if user.role == "admin":
            return queryset
        if user.role == "patient":
            return queryset.filter(user=user)
        if user.role == "caregiver":
            return queryset.filter(user__patient_links__caregiver=user, user__patient_links__status="active").distinct()
        return queryset.none()

    def perform_update(self, serializer):
        profile = self.get_object()
        if self.request.user.role != "admin" and profile.user != self.request.user:
            raise PermissionDenied("You can only update your own profile.")
        serializer.save()
        log_action(user=self.request.user, action="patient_profile_updated", metadata={"profile_id": profile.id})


class CaregiverProfileViewSet(viewsets.ModelViewSet):
    serializer_class = CaregiverProfileSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = CaregiverProfile.objects.select_related("user")
        if user.role == "admin":
            return queryset
        if user.role == "caregiver":
            return queryset.filter(user=user)
        return queryset.none()

    def perform_update(self, serializer):
        profile = self.get_object()
        if self.request.user.role != "admin" and profile.user != self.request.user:
            raise PermissionDenied("You can only update your own profile.")
        serializer.save()
        log_action(user=self.request.user, action="caregiver_profile_updated", metadata={"profile_id": profile.id})
