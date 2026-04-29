from secrets import token_hex

from django.db import IntegrityError
from rest_framework import decorators, status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.audit.services import log_action
from apps.linking.models import CaregiverLink
from apps.linking.serializers import AcceptInviteSerializer, CaregiverLinkSerializer


class CaregiverLinkViewSet(viewsets.ModelViewSet):
    serializer_class = CaregiverLinkSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = CaregiverLink.objects.select_related("patient", "caregiver")
        if user.role == "admin":
            return queryset
        if user.role == "patient":
            return queryset.filter(patient=user)
        if user.role == "caregiver":
            return queryset.filter(caregiver=user, status=CaregiverLink.Status.ACTIVE)
        return queryset.none()

    def create(self, request, *args, **kwargs):
        if request.user.role != "patient":
            raise PermissionDenied("Only patients can generate invite codes.")
        for _ in range(5):
            code = token_hex(4).upper()
            try:
                link = CaregiverLink.objects.create(patient=request.user, invite_code=code)
                log_action(user=request.user, action="caregiver_invite_created", metadata={"link_id": link.id})
                return Response(CaregiverLinkSerializer(link).data, status=status.HTTP_201_CREATED)
            except IntegrityError:
                continue
        raise ValidationError("Could not generate a unique invite code. Please try again.")

    @decorators.action(detail=False, methods=["post"], url_path="accept")
    def accept(self, request):
        if request.user.role != "caregiver":
            raise PermissionDenied("Only caregivers can accept invite codes.")
        serializer = AcceptInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["invite_code"].upper()
        link = CaregiverLink.objects.filter(invite_code=code, status=CaregiverLink.Status.PENDING).first()
        if not link:
            raise ValidationError("Invalid or already-used invite code.")
        existing = CaregiverLink.objects.filter(
            patient=link.patient,
            caregiver=request.user,
            status=CaregiverLink.Status.ACTIVE,
        ).exists()
        if existing:
            raise ValidationError("You are already linked with this patient.")
        link.activate(request.user)
        log_action(user=request.user, action="caregiver_linked", metadata={"link_id": link.id, "patient_id": link.patient_id})
        return Response(CaregiverLinkSerializer(link).data)

    @decorators.action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        link = self.get_object()
        if request.user.role not in ["admin", "patient"] or (request.user.role == "patient" and link.patient != request.user):
            raise PermissionDenied("You cannot revoke this link.")
        link.revoke()
        log_action(user=request.user, action="caregiver_link_revoked", metadata={"link_id": link.id})
        return Response(CaregiverLinkSerializer(link).data)

