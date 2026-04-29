from rest_framework import serializers

from apps.notifications.models import Alert, Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "recipient", "title", "message", "notification_type", "is_read", "created_at"]
        read_only_fields = ["id", "recipient", "title", "message", "notification_type", "created_at"]


class AlertSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    caregiver_name = serializers.CharField(source="created_for_user.full_name", read_only=True)

    class Meta:
        model = Alert
        fields = [
            "id",
            "patient",
            "patient_name",
            "created_for_user",
            "caregiver_name",
            "alert_type",
            "severity",
            "title",
            "message",
            "source_id",
            "source_type",
            "status",
            "caregiver_note",
            "created_at",
            "acknowledged_at",
            "resolved_at",
        ]
        read_only_fields = [
            "id",
            "patient",
            "patient_name",
            "created_for_user",
            "caregiver_name",
            "alert_type",
            "severity",
            "title",
            "message",
            "source_id",
            "source_type",
            "created_at",
            "acknowledged_at",
            "resolved_at",
        ]

