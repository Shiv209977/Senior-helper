from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.appointments.models import Appointment
from apps.linking.models import CaregiverLink
from apps.medications.models import Medication
from apps.notifications.models import Alert
from apps.profiles.models import CaregiverProfile, PatientProfile

User = get_user_model()


class DemoApiFlowTests(APITestCase):
    def setUp(self):
        self.patient = self.create_user("patient@example.com", "Patient One", "patient")
        self.other_patient = self.create_user("other@example.com", "Patient Two", "patient")
        self.caregiver = self.create_user("caregiver@example.com", "Caregiver One", "caregiver")
        self.unlinked_caregiver = self.create_user("unlinked@example.com", "Caregiver Two", "caregiver")
        self.admin = self.create_user("admin@example.com", "Admin User", "admin", is_staff=True, is_superuser=True)

        PatientProfile.objects.create(user=self.patient, age=72)
        PatientProfile.objects.create(user=self.other_patient, age=69)
        CaregiverProfile.objects.create(user=self.caregiver)
        CaregiverProfile.objects.create(user=self.unlinked_caregiver)
        CaregiverLink.objects.create(
            patient=self.patient,
            caregiver=self.caregiver,
            invite_code="LINKED01",
            status=CaregiverLink.Status.ACTIVE,
            approved_at=timezone.now(),
        )

        self.medication = Medication.objects.create(
            patient=self.patient,
            medicine_name="Linked Patient Medicine",
            dosage="1 tablet",
            start_date=timezone.localdate(),
            scheduled_times=["09:00"],
        )
        self.other_medication = Medication.objects.create(
            patient=self.other_patient,
            medicine_name="Private Medicine",
            dosage="1 tablet",
            start_date=timezone.localdate(),
            scheduled_times=["09:00"],
        )

    def create_user(self, email, full_name, role, **extra):
        user = User.objects.create_user(email=email, password="Password123!", full_name=full_name, role=role, **extra)
        return user

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_patient_cannot_access_another_patients_medication(self):
        self.authenticate(self.patient)

        list_response = self.client.get("/api/medications/")
        detail_response = self.client.get(f"/api/medications/{self.other_medication.id}/")

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in list_response.data["results"]], [self.medication.id])
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_caregiver_can_only_view_linked_patient_data(self):
        self.authenticate(self.caregiver)

        response = self.client.get("/api/medications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data["results"]], [self.medication.id])

    def test_linked_caregiver_can_create_vitals_and_symptoms_for_patient(self):
        self.authenticate(self.caregiver)

        vitals_response = self.client.post(
            "/api/vitals/",
            {
                "patient": self.patient.id,
                "temperature": "37.4",
                "heart_rate": 86,
                "oxygen_level": 97,
                "systolic_bp": 124,
                "diastolic_bp": 82,
                "pain_level": 2,
                "fatigue_level": 3,
                "appetite_level": 6,
                "recorded_at": timezone.now().isoformat(),
            },
            format="json",
        )
        symptoms_response = self.client.post(
            "/api/symptoms/",
            {
                "patient": self.patient.id,
                "symptom_date": timezone.localdate().isoformat(),
                "fever": False,
                "symptom_severity_score": 1,
            },
            format="json",
        )

        self.assertEqual(vitals_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(symptoms_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(vitals_response.data["patient"], self.patient.id)
        self.assertEqual(symptoms_response.data["patient"], self.patient.id)

    def test_unlinked_caregiver_cannot_create_vitals_for_patient(self):
        self.authenticate(self.unlinked_caregiver)

        response = self.client.post(
            "/api/vitals/",
            {
                "patient": self.patient.id,
                "temperature": "37.4",
                "recorded_at": timezone.now().isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_alerts_are_created_for_missed_medication_abnormal_vitals_symptoms_emergency_and_ai(self):
        self.authenticate(self.patient)

        medication_response = self.client.post(
            "/api/medication-logs/",
            {
                "medication": self.medication.id,
                "scheduled_datetime": (timezone.now() - timedelta(hours=1)).isoformat(),
                "status": "missed",
            },
            format="json",
        )
        vitals_response = self.client.post(
            "/api/vitals/",
            {
                "temperature": "38.9",
                "heart_rate": 128,
                "oxygen_level": 89,
                "systolic_bp": 130,
                "diastolic_bp": 84,
                "pain_level": 8,
                "fatigue_level": 8,
                "appetite_level": 2,
                "recorded_at": timezone.now().isoformat(),
            },
            format="json",
        )
        symptoms_response = self.client.post(
            "/api/symptoms/",
            {
                "symptom_date": timezone.localdate().isoformat(),
                "breathing_difficulty": True,
                "symptom_severity_score": 9,
            },
            format="json",
        )
        emergency_response = self.client.post(
            "/api/emergencies/",
            {"emergency_type": "urgent_help", "message": "Need help now."},
            format="json",
        )
        ai_response = self.client.post("/api/ai-assessments/", {}, format="json")

        self.assertEqual(medication_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(vitals_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(symptoms_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(emergency_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ai_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Alert.objects.filter(patient=self.patient, alert_type="medication").exists())
        self.assertTrue(Alert.objects.filter(patient=self.patient, alert_type="vitals").exists())
        self.assertTrue(Alert.objects.filter(patient=self.patient, alert_type="symptom").exists())
        self.assertTrue(Alert.objects.filter(patient=self.patient, alert_type="emergency").exists())
        self.assertTrue(Alert.objects.filter(patient=self.patient, alert_type="ai").exists())

    def test_caregiver_ai_assessment_requires_linked_patient(self):
        self.authenticate(self.caregiver)

        linked_response = self.client.post("/api/ai-assessments/", {"patient": self.patient.id}, format="json")
        unlinked_response = self.client.post("/api/ai-assessments/", {"patient": self.other_patient.id}, format="json")

        self.assertEqual(linked_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(unlinked_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_caregiver_can_acknowledge_and_resolve_linked_patient_alert(self):
        alert = Alert.objects.create(
            patient=self.patient,
            created_for_user=self.caregiver,
            alert_type="medication",
            severity="medium",
            title="Missed medicine",
            message="A dose was missed.",
        )
        self.authenticate(self.caregiver)

        acknowledge_response = self.client.post(f"/api/alerts/{alert.id}/acknowledge/", {}, format="json")
        resolve_response = self.client.post(f"/api/alerts/{alert.id}/resolve/", {}, format="json")

        self.assertEqual(acknowledge_response.status_code, status.HTTP_200_OK)
        self.assertEqual(acknowledge_response.data["status"], Alert.Status.ACKNOWLEDGED)
        self.assertEqual(resolve_response.status_code, status.HTTP_200_OK)
        self.assertEqual(resolve_response.data["status"], Alert.Status.RESOLVED)

    def test_disabled_user_cannot_log_in(self):
        self.patient.is_active = False
        self.patient.save(update_fields=["is_active"])
        self.client.force_authenticate(user=None)

        response = self.client.post("/api/auth/login/", {"email": self.patient.email, "password": "Password123!"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_disable_and_enable_user(self):
        self.authenticate(self.admin)

        disable_response = self.client.patch(f"/api/admin/users/{self.patient.id}/", {"is_active": False}, format="json")
        enable_response = self.client.patch(f"/api/admin/users/{self.patient.id}/", {"is_active": True}, format="json")

        self.assertEqual(disable_response.status_code, status.HTTP_200_OK)
        self.assertFalse(disable_response.data["is_active"])
        self.assertEqual(enable_response.status_code, status.HTTP_200_OK)
        self.assertTrue(enable_response.data["is_active"])

    def test_patient_can_mark_appointment_missed_and_create_alert(self):
        appointment = Appointment.objects.create(
            patient=self.patient,
            title="Demo appointment",
            appointment_type=Appointment.AppointmentType.FOLLOW_UP,
            date=timezone.localdate(),
            time="10:00",
        )
        self.authenticate(self.patient)

        response = self.client.patch(f"/api/appointments/{appointment.id}/", {"status": "missed"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Alert.objects.filter(patient=self.patient, alert_type="appointment").exists())
