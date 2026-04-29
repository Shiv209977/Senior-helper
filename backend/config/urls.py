from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.ai_assessment.views import AIRiskAssessmentViewSet
from apps.appointments.views import AppointmentViewSet
from apps.audit.views import AuditLogViewSet
from apps.health.views import EmergencyRequestViewSet, SymptomRecordViewSet, VitalSignViewSet
from apps.linking.views import CaregiverLinkViewSet
from apps.medications.views import MedicationLogViewSet, MedicationViewSet
from apps.notifications.views import AlertViewSet, NotificationViewSet
from apps.profiles.views import CaregiverProfileViewSet, PatientProfileViewSet
from apps.users.views import CurrentUserView, LoginView, RegisterView, UserAdminViewSet

router = DefaultRouter()
router.register("admin/users", UserAdminViewSet, basename="admin-users")
router.register("admin/audit-logs", AuditLogViewSet, basename="audit-logs")
router.register("profiles/patients", PatientProfileViewSet, basename="patient-profiles")
router.register("profiles/caregivers", CaregiverProfileViewSet, basename="caregiver-profiles")
router.register("caregiver-links", CaregiverLinkViewSet, basename="caregiver-links")
router.register("medications", MedicationViewSet, basename="medications")
router.register("medication-logs", MedicationLogViewSet, basename="medication-logs")
router.register("appointments", AppointmentViewSet, basename="appointments")
router.register("notifications", NotificationViewSet, basename="notifications")
router.register("alerts", AlertViewSet, basename="alerts")
router.register("vitals", VitalSignViewSet, basename="vitals")
router.register("symptoms", SymptomRecordViewSet, basename="symptoms")
router.register("emergencies", EmergencyRequestViewSet, basename="emergencies")
router.register("ai-assessments", AIRiskAssessmentViewSet, basename="ai-assessments")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/auth/me/", CurrentUserView.as_view(), name="current-user"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

