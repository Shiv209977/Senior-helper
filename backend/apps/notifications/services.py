from django.utils import timezone


def linked_caregivers_for(patient):
    from apps.linking.models import CaregiverLink

    return [
        link.caregiver
        for link in CaregiverLink.objects.select_related("caregiver").filter(
            patient=patient,
            status=CaregiverLink.Status.ACTIVE,
            caregiver__is_active=True,
        )
    ]


def notify_user(recipient, title, message, notification_type="general"):
    from apps.notifications.models import Notification

    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
    )


def create_alert_for_patient(patient, alert_type, severity, title, message, source=None):
    from apps.notifications.models import Alert

    caregivers = linked_caregivers_for(patient)
    alerts = []
    source_id = getattr(source, "id", None)
    source_type = source.__class__.__name__ if source else ""

    if not caregivers:
        alerts.append(
            Alert.objects.create(
                patient=patient,
                alert_type=alert_type,
                severity=severity,
                title=title,
                message=message,
                source_id=source_id,
                source_type=source_type,
            )
        )
        return alerts

    for caregiver in caregivers:
        alert = Alert.objects.create(
            patient=patient,
            created_for_user=caregiver,
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
            source_id=source_id,
            source_type=source_type,
        )
        notify_user(caregiver, title, message, notification_type=f"alert:{alert_type}")
        alerts.append(alert)
    return alerts


def mark_alert(alert, status, note=""):
    from apps.notifications.models import Alert

    alert.status = status
    if note:
        alert.caregiver_note = note
    if status == Alert.Status.ACKNOWLEDGED:
        alert.acknowledged_at = timezone.now()
    if status == Alert.Status.RESOLVED:
        alert.resolved_at = timezone.now()
    alert.save()
    return alert

