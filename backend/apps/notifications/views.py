from django.db.models import Case, IntegerField, Value, When
from rest_framework import decorators, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.linking.models import CaregiverLink
from apps.notifications.models import Alert, Notification
from apps.notifications.serializers import AlertSerializer, NotificationSerializer
from apps.notifications.services import mark_alert

SEVERITY_ORDER = Case(
    When(severity="emergency", then=Value(1)),
    When(severity="high", then=Value(2)),
    When(severity="medium", then=Value(3)),
    When(severity="low", then=Value(4)),
    default=Value(5),
    output_field=IntegerField(),
)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    http_method_names = ["get", "patch", "post", "head", "options"]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.recipient != self.request.user:
            raise PermissionDenied("You cannot edit this notification.")
        serializer.save()

    @decorators.action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({"ok": True})


class AlertViewSet(viewsets.ModelViewSet):
    serializer_class = AlertSerializer
    http_method_names = ["get", "patch", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = Alert.objects.select_related("patient", "created_for_user").annotate(
            severity_rank=SEVERITY_ORDER
        ).order_by("severity_rank", "-created_at")
        if user.role == "admin":
            return queryset
        if user.role == "patient":
            return queryset.filter(patient=user)
        if user.role == "caregiver":
            linked_ids = CaregiverLink.objects.filter(caregiver=user, status=CaregiverLink.Status.ACTIVE).values_list("patient_id", flat=True)
            return queryset.filter(patient_id__in=linked_ids, created_for_user__in=[user, None])
        return queryset.none()

    @decorators.action(detail=True, methods=["post"])
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        if request.user.role not in ["caregiver", "admin"]:
            raise PermissionDenied("Only caregivers or admins can acknowledge alerts.")
        return Response(AlertSerializer(mark_alert(alert, Alert.Status.ACKNOWLEDGED, request.data.get("note", ""))).data)

    @decorators.action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        if request.user.role not in ["caregiver", "admin"]:
            raise PermissionDenied("Only caregivers or admins can resolve alerts.")
        return Response(AlertSerializer(mark_alert(alert, Alert.Status.RESOLVED, request.data.get("note", ""))).data)
