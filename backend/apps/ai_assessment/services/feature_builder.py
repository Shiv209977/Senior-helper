from datetime import timedelta

from django.utils import timezone

from apps.appointments.models import Appointment
from apps.health.models import EmergencyRequest, SymptomRecord, VitalSign
from apps.medications.models import MedicationLog


def safe_int(value, default=0):
    if value is None:
        return default
    return int(value)


def build_features_for_patient(patient):
    latest_vitals = VitalSign.objects.filter(patient=patient).order_by("-recorded_at").first()
    latest_symptoms = SymptomRecord.objects.filter(patient=patient).order_by("-symptom_date", "-created_at").first()
    now = timezone.now()

    profile = getattr(patient, "patient_profile", None)
    missed_med_24h = MedicationLog.objects.filter(
        patient=patient,
        status=MedicationLog.Status.MISSED,
        scheduled_datetime__gte=now - timedelta(hours=24),
    ).count()
    missed_appt_30d = Appointment.objects.filter(
        patient=patient,
        status=Appointment.Status.MISSED,
        date__gte=timezone.localdate() - timedelta(days=30),
    ).count()
    emergency_30d = EmergencyRequest.objects.filter(
        patient=patient,
        created_at__gte=now - timedelta(days=30),
    ).count()

    features = {
        "age": getattr(profile, "age", None) or 0,
        "cancer_type": getattr(profile, "cancer_type", "") if profile else "",
        "treatment_stage": getattr(profile, "treatment_stage", "") if profile else "",
        "temperature": float(latest_vitals.temperature) if latest_vitals and latest_vitals.temperature is not None else None,
        "heart_rate": latest_vitals.heart_rate if latest_vitals else None,
        "oxygen_level": latest_vitals.oxygen_level if latest_vitals else None,
        "systolic_bp": latest_vitals.systolic_bp if latest_vitals else None,
        "diastolic_bp": latest_vitals.diastolic_bp if latest_vitals else None,
        "pain_level": safe_int(getattr(latest_vitals, "pain_level", 0)),
        "fatigue_level": safe_int(getattr(latest_vitals, "fatigue_level", 0)),
        "appetite_level": safe_int(getattr(latest_vitals, "appetite_level", 5), 5),
        "fever": bool(getattr(latest_symptoms, "fever", False)),
        "nausea": bool(getattr(latest_symptoms, "nausea", False)),
        "vomiting": bool(getattr(latest_symptoms, "vomiting", False)),
        "breathing_difficulty": bool(getattr(latest_symptoms, "breathing_difficulty", False)),
        "bleeding": bool(getattr(latest_symptoms, "bleeding", False)),
        "infection_signs": bool(getattr(latest_symptoms, "infection_signs", False)),
        "missed_med_24h": missed_med_24h,
        "missed_appt_30d": missed_appt_30d,
        "emergency_30d": emergency_30d,
        "latest_vitals_id": latest_vitals.id if latest_vitals else None,
        "latest_symptoms_id": latest_symptoms.id if latest_symptoms else None,
        "has_vitals": latest_vitals is not None,
        "has_symptoms": latest_symptoms is not None,
    }
    return features

