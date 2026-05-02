from datetime import datetime, time

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.ai_assessment.models import AIRiskAssessment
from apps.ai_assessment.services.feature_builder import build_features_for_patient
from apps.ai_assessment.services.rule_engine import score_features
from apps.appointments.models import Appointment
from apps.health.models import SymptomRecord, VitalSign
from apps.linking.models import CaregiverLink
from apps.medications.models import Medication, MedicationLog
from apps.notifications.models import Alert
from apps.profiles.models import CaregiverProfile, PatientProfile

User = get_user_model()


class Command(BaseCommand):
    help = "Create demo admin, patient, caregiver, and sample care data."

    def handle(self, *args, **options):
        admin = self.ensure_user("admin@example.com", "Admin User", "admin")
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()

        patient = self.ensure_user("patient@example.com", "Maya Rao", "patient")
        caregiver = self.ensure_user("caregiver@example.com", "Anita Rao", "caregiver")

        PatientProfile.objects.update_or_create(
            user=patient,
            defaults={
                "age": 72,
                "gender": "Female",
                "emergency_contact_name": "Anita Rao",
                "emergency_contact_phone": "9999999999",
                "cancer_type": "User-entered oncology care",
                "treatment_stage": "Follow-up",
                "primary_hospital": "City Care Hospital",
                "doctor_name": "Dr. Mehta",
            },
        )
        CaregiverProfile.objects.update_or_create(user=caregiver, defaults={"relationship_to_patient": "Daughter", "phone": "9999999999"})
        CaregiverLink.objects.update_or_create(
            patient=patient,
            caregiver=caregiver,
            defaults={"invite_code": "DEMO2026", "status": CaregiverLink.Status.ACTIVE, "approved_at": timezone.now()},
        )

        medication, _ = Medication.objects.get_or_create(
            patient=patient,
            medicine_name="Demo Medicine",
            defaults={
                "dosage": "1 tablet",
                "frequency_type": Medication.Frequency.ONCE_DAILY,
                "scheduled_times": ["09:00"],
                "start_date": timezone.localdate(),
            },
        )
        evening_medication, _ = Medication.objects.get_or_create(
            patient=patient,
            medicine_name="Evening Support Tablet",
            defaults={
                "dosage": "1 tablet after dinner",
                "frequency_type": Medication.Frequency.ONCE_DAILY,
                "scheduled_times": ["21:00"],
                "start_date": timezone.localdate(),
                "instructions": "Demo medication used to show missed-dose alerts.",
            },
        )
        Appointment.objects.get_or_create(
            patient=patient,
            title="Oncology follow-up",
            date=timezone.localdate(),
            time="10:30",
            defaults={"appointment_type": Appointment.AppointmentType.FOLLOW_UP, "hospital_name": "City Care Hospital"},
        )
        VitalSign.objects.get_or_create(
            patient=patient,
            recorded_by=patient,
            recorded_at=timezone.now(),
            defaults={"temperature": 37.1, "heart_rate": 82, "oxygen_level": 98, "systolic_bp": 122, "diastolic_bp": 80, "pain_level": 2},
        )
        SymptomRecord.objects.get_or_create(
            patient=patient,
            recorded_by=patient,
            symptom_date=timezone.localdate(),
            defaults={"symptom_severity_score": 1},
        )
        missed_time = timezone.make_aware(datetime.combine(timezone.localdate(), time(hour=7)))
        missed_log, _ = MedicationLog.objects.update_or_create(
            medication=evening_medication,
            scheduled_datetime=missed_time,
            defaults={"patient": patient, "status": MedicationLog.Status.MISSED, "marked_at": timezone.now()},
        )
        Alert.objects.get_or_create(
            patient=patient,
            created_for_user=caregiver,
            alert_type="medication",
            severity="medium",
            title="Missed medicine",
            source_id=missed_log.id,
            source_type="MedicationLog",
            defaults={"message": f"{evening_medication.medicine_name} was marked as missed."},
        )

        features = build_features_for_patient(patient)
        assessment_result = score_features(features)
        AIRiskAssessment.objects.update_or_create(
            patient=patient,
            requested_by=patient,
            model_version="rule-based-demo-seed",
            defaults={
                "risk_score": assessment_result["risk_score"],
                "risk_category": assessment_result["risk_category"],
                "confidence": assessment_result["confidence"],
                "reasons": assessment_result["reasons"],
                "suggested_action": assessment_result["suggested_action"],
                "disclaimer": assessment_result["disclaimer"],
                "input_snapshot": features,
                "rule_score": assessment_result["rule_score"],
                "ml_score": None,
            },
        )

        self.stdout.write(self.style.SUCCESS("Demo users created. Password for all demo users: Password123!"))

    def ensure_user(self, email, full_name, role):
        user, created = User.objects.get_or_create(email=email, defaults={"full_name": full_name, "role": role, "phone": ""})
        if created or not user.has_usable_password():
            user.set_password("Password123!")
        user.full_name = full_name
        user.role = role
        user.is_active = True
        user.save()
        return user
