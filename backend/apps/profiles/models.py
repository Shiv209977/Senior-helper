from django.conf import settings
from django.db import models


class PatientProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name="patient_profile", on_delete=models.CASCADE)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=40, blank=True)
    address = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=160, blank=True)
    emergency_contact_phone = models.CharField(max_length=32, blank=True)
    cancer_type = models.CharField(max_length=120, blank=True)
    treatment_stage = models.CharField(max_length=120, blank=True)
    primary_hospital = models.CharField(max_length=180, blank=True)
    doctor_name = models.CharField(max_length=160, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.full_name


class CaregiverProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name="caregiver_profile", on_delete=models.CASCADE)
    relationship_to_patient = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    address = models.TextField(blank=True)
    availability_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.full_name

