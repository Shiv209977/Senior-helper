// ─── Lifeway Cancer Support — Shared API Types ──────────────────────────

export type Role = 'patient' | 'caregiver' | 'admin';

export type User = {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: Role;
  is_active: boolean;
  created_at?: string;
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
  status: 'pending' | 'active' | 'revoked';
};

export type Medication = {
  id: number;
  patient: number;
  medicine_name: string;
  dosage: string;
  frequency_type: 'once_daily' | 'twice_daily' | 'custom';
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
  status: 'pending' | 'taken' | 'missed' | 'skipped' | 'delayed';
  marked_at: string | null;
  notes: string;
};

export type Appointment = {
  id: number;
  patient: number;
  title: string;
  appointment_type: 'consultation' | 'treatment' | 'scan' | 'lab_test' | 'follow_up' | 'other';
  hospital_name: string;
  doctor_name: string;
  date: string;
  time: string;
  notes: string;
  status: 'upcoming' | 'completed' | 'missed' | 'cancelled';
};

export type Alert = {
  id: number;
  patient: number;
  patient_name: string;
  created_for_user: number | null;
  caregiver_name: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'emergency';
  title: string;
  message: string;
  source_id: number | null;
  source_type: string;
  status: 'open' | 'acknowledged' | 'resolved';
  caregiver_note: string;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
};

export type Notification = {
  id: number;
  recipient: number;
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
  recorded_by: number;
  temperature: string | null;
  heart_rate: number | null;
  oxygen_level: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  pain_level: number;
  fatigue_level: number;
  appetite_level: number;
  recorded_at: string;
  notes: string;
  created_at: string;
};

export type SymptomRecord = {
  id: number;
  patient: number;
  patient_name: string;
  recorded_by: number;
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
  triggered_by: number;
  emergency_type: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'cancelled';
  created_at: string;
  acknowledged_by: number | null;
  resolved_at: string | null;
};

export type AIRiskAssessment = {
  id: number;
  patient: number;
  patient_name: string;
  requested_by: number;
  requested_by_name: string;
  risk_score: number;
  risk_category: 'low' | 'medium' | 'high' | 'emergency';
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
  created_alert: number | null;
  created_at: string;
};

export type AuditLog = {
  id: number;
  user: number;
  user_email: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

// ─── Pagination wrapper ──────────────────────────────────────────────────
export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// ─── Auth payloads ───────────────────────────────────────────────────────
export type AuthTokens = {
  access: string;
  refresh: string;
  user: User;
};

export type RegisterPayload = {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: 'patient' | 'caregiver';
};

export type LoginPayload = {
  email: string;
  password: string;
};

// ─── Chat types ───────────────────────────────────────────────────────────
export type ChatMessage = {
  id: number;
  patient: number;
  sender: number;
  role: 'user' | 'assistant';
  content: string;
  concern_level: number | null;
  unstructured_notes: string;
  created_at: string;
};

export type ChatResponse = {
  response: string;
  concern_level: number | null;
  unstructured_notes: string;
  modifier_applied: number;
};
