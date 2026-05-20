import axios, { AxiosError } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export type Role = "patient" | "caregiver" | "admin";

export type User = {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: Role;
  is_active: boolean;
  created_at?: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type PatientProfile = {
  id: number;
  user: number;
  full_name: string;
  email: string;
  age: number | null;
  gender: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  cancer_type: string;
  treatment_stage: string;
  primary_hospital: string;
  doctor_name: string;
  notes: string;
};

export type CaregiverProfile = {
  id: number;
  user: number;
  full_name: string;
  email: string;
  relationship_to_patient: string;
  phone: string;
  address: string;
  availability_notes: string;
};

export type CaregiverLink = {
  id: number;
  patient: number;
  patient_name: string;
  caregiver: number | null;
  caregiver_name: string;
  invite_code: string;
  status: string;
};

export type Medication = {
  id: number;
  patient: number;
  medicine_name: string;
  dosage: string;
  frequency_type: string;
  scheduled_times: string[];
  start_date: string;
  end_date: string | null;
  grace_period_minutes: number;
  instructions: string;
  is_active: boolean;
};

export type MedicationLog = {
  id: number;
  medication: number;
  medication_name: string;
  patient: number;
  scheduled_datetime: string;
  status: string;
  marked_at: string | null;
  notes: string;
};

export type Appointment = {
  id: number;
  patient: number;
  title: string;
  appointment_type: string;
  hospital_name: string;
  doctor_name: string;
  date: string;
  time: string;
  notes: string;
  status: string;
};

export type Alert = {
  id: number;
  patient: number;
  patient_name: string;
  title: string;
  message: string;
  alert_type: string;
  severity: string;
  status: string;
  caregiver_note: string;
  created_at: string;
};

export type Notification = {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
};

export type VitalSign = {
  id: number;
  patient: number;
  patient_name: string;
  recorded_at: string;
  temperature: string | null;
  heart_rate: number | null;
  oxygen_level: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  pain_level: number;
  fatigue_level: number;
  appetite_level: number;
  notes: string;
};

export type SymptomRecord = {
  id: number;
  patient: number;
  patient_name: string;
  symptom_date: string;
  fever: boolean;
  nausea: boolean;
  vomiting: boolean;
  severe_pain: boolean;
  breathing_difficulty: boolean;
  dizziness: boolean;
  bleeding: boolean;
  fatigue: boolean;
  appetite_loss: boolean;
  infection_signs: boolean;
  symptom_severity_score: number;
  notes: string;
  created_at: string;
};

export type EmergencyRequest = {
  id: number;
  patient: number;
  patient_name: string;
  emergency_type: string;
  message: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
};

export type AIRiskAssessment = {
  id: number;
  patient: number;
  patient_name: string;
  requested_by: number;
  risk_score: number;
  risk_category: string;
  confidence: string | null;
  confidence_explanation: string[];
  freshness_warnings: string[];
  risk_trend: {
    direction: string;
    message: string;
    previous_score: number | null;
    previous_category: string | null;
  };
  reasons: string[];
  suggested_action: string;
  disclaimer: string;
  input_snapshot: Record<string, unknown>;
  model_version: string;
  rule_score: number;
  ml_score: number | null;
  created_at: string;
};

export type AuditLog = { id: number; user_email: string; action: string; created_at: string };

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === "/auth/refresh/") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          localStorage.removeItem("access_token");
          window.location.href = "/login";
          return Promise.reject(error);
        }
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh: refreshToken });
          localStorage.setItem("access_token", data.access);
          isRefreshing = false;
          onRefreshed(data.access);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch {
          isRefreshing = false;
          refreshSubscribers = [];
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return Promise.reject(error);
        }
      }

      return new Promise((resolve) => {
        refreshSubscribers.push((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }
    return Promise.reject(error);
  },
);

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login/", { email, password });
  return data as { access: string; refresh: string; user: User };
}

export async function register(payload: {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: "patient" | "caregiver";
}) {
  const { data } = await api.post("/auth/register/", payload);
  return data as { access: string; refresh: string; user: User };
}

export async function currentUser() {
  const { data } = await api.get("/auth/me/");
  return data as User;
}

export async function listPatientProfiles() {
  const { data } = await api.get("/profiles/patients/");
  return data as PatientProfile[];
}

export async function updatePatientProfile(id: number, payload: Partial<PatientProfile>) {
  const { data } = await api.patch(`/profiles/patients/${id}/`, payload);
  return data as PatientProfile;
}

export async function listCaregiverProfiles() {
  const { data } = await api.get("/profiles/caregivers/");
  return data as CaregiverProfile[];
}

export async function listCaregiverLinks() {
  const { data } = await api.get("/caregiver-links/");
  return data as CaregiverLink[];
}

export async function createCaregiverInvite() {
  const { data } = await api.post("/caregiver-links/");
  return data as CaregiverLink;
}

export async function acceptCaregiverInvite(invite_code: string) {
  const { data } = await api.post("/caregiver-links/accept/", { invite_code });
  return data as CaregiverLink;
}

export async function listMedications(page = 1) {
  const { data } = await api.get("/medications/", { params: { page } });
  return data as PaginatedResponse<Medication>;
}

export async function createMedication(payload: Partial<Medication>) {
  const { data } = await api.post("/medications/", payload);
  return data as Medication;
}

export async function updateMedication(id: number, payload: Partial<Medication>) {
  const { data } = await api.patch(`/medications/${id}/`, payload);
  return data as Medication;
}

export async function listMedicationLogs(page = 1) {
  const { data } = await api.get("/medication-logs/", { params: { page } });
  return data as PaginatedResponse<MedicationLog>;
}

export async function createMedicationLog(payload: Partial<MedicationLog>) {
  const { data } = await api.post("/medication-logs/", payload);
  return data as MedicationLog;
}

export async function updateMedicationLog(id: number, payload: Partial<MedicationLog>) {
  const { data } = await api.patch(`/medication-logs/${id}/`, payload);
  return data as MedicationLog;
}

export async function listAppointments(page = 1) {
  const { data } = await api.get("/appointments/", { params: { page } });
  return data as PaginatedResponse<Appointment>;
}

export async function createAppointment(payload: Partial<Appointment>) {
  const { data } = await api.post("/appointments/", payload);
  return data as Appointment;
}

export async function updateAppointment(id: number, payload: Partial<Appointment>) {
  const { data } = await api.patch(`/appointments/${id}/`, payload);
  return data as Appointment;
}

export async function listVitals(page = 1) {
  const { data } = await api.get("/vitals/", { params: { page } });
  return data as PaginatedResponse<VitalSign>;
}

export async function createVitals(payload: Partial<VitalSign>) {
  const { data } = await api.post("/vitals/", payload);
  return data as VitalSign;
}

export async function listSymptoms(page = 1) {
  const { data } = await api.get("/symptoms/", { params: { page } });
  return data as PaginatedResponse<SymptomRecord>;
}

export async function createSymptoms(payload: Partial<SymptomRecord>) {
  const { data } = await api.post("/symptoms/", payload);
  return data as SymptomRecord;
}

export async function listEmergencies(page = 1) {
  const { data } = await api.get("/emergencies/", { params: { page } });
  return data as PaginatedResponse<EmergencyRequest>;
}

export async function createEmergency(payload: Partial<EmergencyRequest>) {
  const { data } = await api.post("/emergencies/", payload);
  return data as EmergencyRequest;
}

export async function acknowledgeEmergency(id: number) {
  const { data } = await api.post(`/emergencies/${id}/acknowledge/`, {});
  return data as EmergencyRequest;
}

export async function resolveEmergency(id: number) {
  const { data } = await api.post(`/emergencies/${id}/resolve/`, {});
  return data as EmergencyRequest;
}

export async function listAlerts(page = 1) {
  const { data } = await api.get("/alerts/", { params: { page } });
  return data as PaginatedResponse<Alert>;
}

export async function acknowledgeAlert(id: number, note = "") {
  const { data } = await api.post(`/alerts/${id}/acknowledge/`, { note });
  return data as Alert;
}

export async function resolveAlert(id: number, note = "") {
  const { data } = await api.post(`/alerts/${id}/resolve/`, { note });
  return data as Alert;
}

export async function listNotifications(page = 1) {
  const { data } = await api.get("/notifications/", { params: { page } });
  return data as PaginatedResponse<Notification>;
}

export async function markNotificationRead(id: number) {
  const { data } = await api.patch(`/notifications/${id}/`, { is_read: true });
  return data as Notification;
}

export async function markAllNotificationsRead() {
  await api.post("/notifications/mark-all-read/");
}

export async function listAssessments(page = 1) {
  const { data } = await api.get("/ai-assessments/", { params: { page } });
  return data as PaginatedResponse<AIRiskAssessment>;
}

export async function runAssessment(patient?: number) {
  const { data } = await api.post("/ai-assessments/", patient ? { patient } : {});
  return data as AIRiskAssessment;
}

export async function listAdminUsers(page = 1) {
  const { data } = await api.get("/admin/users/", { params: { page } });
  return data as PaginatedResponse<User>;
}

export async function updateAdminUser(id: number, payload: Partial<User>) {
  const { data } = await api.patch(`/admin/users/${id}/`, payload);
  return data as User;
}

export async function listAuditLogs(page = 1) {
  const { data } = await api.get("/admin/audit-logs/", { params: { page } });
  return data as PaginatedResponse<AuditLog>;
}

export function apiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const detail = (data as { detail?: unknown; non_field_errors?: unknown }).detail ?? (data as { non_field_errors?: unknown }).non_field_errors;
      if (Array.isArray(detail)) return detail.join(" ");
      if (typeof detail === "string") return detail;
      const firstValue = Object.values(data)[0];
      if (Array.isArray(firstValue)) return firstValue.join(" ");
      if (typeof firstValue === "string") return firstValue;
    }
  }
  return fallback;
}

export function dashboardPath(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "caregiver") return "/caregiver";
  return "/patient/today";
}
