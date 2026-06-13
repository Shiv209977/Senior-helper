from datetime import date, timedelta

from django.utils import timezone

from apps.medications.models import Medication, MedicationLog
from apps.notifications.services import create_alert_for_patient


def generate_daily_dose_logs():
    today = date.today()
    now = timezone.now()

    medications = Medication.objects.filter(is_active=True).exclude(
        end_date__lt=today,
    ).select_related("patient")

    created = 0
    for med in medications:
        if med.start_date > today:
            continue
        for time_str in med.scheduled_times:
            hour, minute = (int(p) for p in time_str.strip().split(":", 1))
            scheduled = timezone.make_aware(
                timezone.datetime(today.year, today.month, today.day, hour, minute, 0)
            )
            if scheduled > now:
                continue
            _, was_created = MedicationLog.objects.get_or_create(
                medication=med,
                patient=med.patient,
                scheduled_datetime=scheduled,
                defaults={"status": MedicationLog.Status.PENDING},
            )
            if was_created:
                created += 1

    return created


def auto_mark_overdue_missed():
    now = timezone.now()
    overdue = MedicationLog.objects.filter(
        status=MedicationLog.Status.PENDING,
        scheduled_datetime__lt=now - timedelta(minutes=0),
    ).select_related("medication", "patient")

    marked = 0
    for log in overdue:
        grace = log.medication.grace_period_minutes or 0
        cutoff = log.scheduled_datetime + timedelta(minutes=grace)
        if now < cutoff:
            continue
        log.status = MedicationLog.Status.MISSED
        log.marked_at = now
        log.save(update_fields=["status", "marked_at"])
        create_alert_for_patient(
            patient=log.patient,
            alert_type="medication",
            severity="medium",
            title="Missed medicine",
            message=f"{log.medication.medicine_name} dose was automatically marked as missed.",
            source=log,
        )
        marked += 1

    return marked
