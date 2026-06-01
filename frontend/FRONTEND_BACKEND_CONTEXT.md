# Lifeway Cancer Support — Backend API Context (for the frontend agent)

> Give this whole file to your frontend web agent. It is everything needed to build the UI
> against the existing backend **without changing any endpoints, field names, or auth flow**.
> The backend is **fixed** — the frontend must conform to it. Do not invent endpoints or fields.

---

## 1. Product in one paragraph

A senior-friendly web app for cancer patients and their caregivers. Three roles: **patient**,
**caregiver**, **admin**. Patients track medications, appointments, vitals, symptoms, and can
trigger emergencies and AI risk checks. Caregivers link to patients via invite codes and monitor
their alerts/vitals. Admins manage users and view audit logs. The mockup is a marketing-style
landing/dashboard; build the authenticated app screens to match its calm, high-contrast,
large-text, senior-friendly aesthetic (soft teal/green + lavender/purple accents, generous
spacing, large tap targets, clear primary buttons).

---

## 2. Tech / conventions (must match)

- **API base URL:** `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api"`. All paths below are **relative to `/api`**.
- **Auth:** JWT (SimpleJWT). Send `Authorization: Bearer <access_token>` on every request except register/login/refresh.
  - Access token lifetime 60 min, refresh token 7 days.
  - On `401`, call `POST /auth/refresh/` with `{ refresh }` to get a new `access`. If refresh fails, clear tokens and redirect to `/login`.
  - Store tokens in `localStorage` as `access_token` and `refresh_token`.
- **Trailing slashes are REQUIRED** on every URL (Django). e.g. `/medications/`, not `/medications`.
- **Content type:** JSON.
- **Pagination:** Most list endpoints are paginated, `PAGE_SIZE = 20`. Paginated response shape:
  ```ts
  { count: number; next: string | null; previous: string | null; results: T[] }
  ```
  Pass `?page=N`. **Exceptions (NOT paginated — return a plain array):** `/profiles/patients/`, `/caregiver-links/`. Everything else paginated returns the wrapper.
- **Errors:** Non-2xx returns either `{ "detail": "..." }`, `{ "non_field_errors": ["..."] }`, or per-field `{ "field_name": ["msg"] }`. Surface the first available message.
- **CORS:** backend allows `http://localhost:5173` (Vite dev) by default.

---

## 3. Roles & permissions (drives what each screen shows)

| Role | Can see / do |
|------|--------------|
| **patient** | Only their own data. Creates meds, appointments, vitals, symptoms, emergencies, AI assessments. Generates caregiver invite codes. |
| **caregiver** | Read data for **actively-linked** patients only. Accepts invite codes. Acknowledges/resolves alerts & emergencies. Can record vitals/symptoms for linked patients. **Cannot** create meds/appointments. |
| **admin** | Everything. Manage users (`/admin/users/`), view audit logs (`/admin/audit-logs/`). |

Role-based redirect after login:
- `admin` → `/admin`
- `caregiver` → `/caregiver`
- `patient` → `/patient/today`

Who-can-write rules enforced by backend (respect them in the UI — hide/disable controls accordingly):
- Only **patients** create medications, medication logs, appointments, emergencies, and caregiver invites.
- Only **caregivers** accept invite codes.
- Only **caregivers/admins** acknowledge/resolve alerts and emergencies.
- A patient may only act on their own records.

---

## 4. Auth endpoints

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/auth/register/` | `{ email, password (min 8), full_name, phone, role }` where `role` ∈ `"patient" \| "caregiver"` (admin NOT allowed) | `{ access, refresh, user }`, 201 |
| POST | `/auth/login/` | `{ email, password }` | `{ access, refresh, user }` |
| POST | `/auth/refresh/` | `{ refresh }` | `{ access }` |
| GET | `/auth/me/` | — | `User` |

**Demo accounts** (after backend seeds with `create_demo_users`): password for all is `Password123!`
- `admin@example.com` (admin)
- `patient@example.com` (patient — "Maya Rao")
- `caregiver@example.com` (caregiver — linked to the patient)

---

## 5. Data types (exact field names returned by the API)

```ts
type Role = "patient" | "caregiver" | "admin";

type User = {
  id: number; email: string; full_name: string; phone: string;
  role: Role; is_active: boolean; created_at?: string;
};

type PatientProfile = {
  id: number; user: number; full_name: string; email: string;
  age: number | null; gender: string; address: string;
  emergency_contact_name: string; emergency_contact_phone: string;
  cancer_type: string; treatment_stage: string;
  primary_hospital: string; doctor_name: string; notes: string;
};

type CaregiverProfile = {
  id: number; user: number; full_name: string; email: string;
  relationship_to_patient: string; phone: string; address: string;
  availability_notes: string;
};

type CaregiverLink = {
  id: number; patient: number; patient_name: string;
  caregiver: number | null; caregiver_name: string;
  invite_code: string; status: "pending" | "active" | "revoked";
};

type Medication = {
  id: number; patient: number; medicine_name: string; dosage: string;
  frequency_type: "once_daily" | "twice_daily" | "custom";
  scheduled_times: string[];   // e.g. ["09:00", "21:00"]
  start_date: string;          // "YYYY-MM-DD"
  end_date: string | null;     // "YYYY-MM-DD"
  grace_period_minutes: number; instructions: string; is_active: boolean;
};

type MedicationLog = {
  id: number; medication: number; medication_name: string; patient: number;
  scheduled_datetime: string;  // ISO datetime
  status: "pending" | "taken" | "missed" | "skipped" | "delayed";
  marked_at: string | null; notes: string;
};

type Appointment = {
  id: number; patient: number; title: string;
  appointment_type: "consultation" | "treatment" | "scan" | "lab_test" | "follow_up" | "other";
  hospital_name: string; doctor_name: string;
  date: string;  // "YYYY-MM-DD"
  time: string;  // "HH:MM" (24h, seconds optional)
  notes: string;
  status: "upcoming" | "completed" | "missed" | "cancelled";
};

type Alert = {
  id: number; patient: number; patient_name: string;
  created_for_user: number | null; caregiver_name: string;
  alert_type: string;  // "medication" | "appointment" | "vitals" | "symptom" | "emergency" | "ai"
  severity: "low" | "medium" | "high" | "emergency";
  title: string; message: string;
  source_id: number | null; source_type: string;
  status: "open" | "acknowledged" | "resolved";
  caregiver_note: string;
  created_at: string; acknowledged_at: string | null; resolved_at: string | null;
};

type Notification = {
  id: number; recipient: number; title: string; message: string;
  notification_type: string; is_read: boolean; created_at: string;
};

type VitalSign = {
  id: number; patient: number; patient_name: string; recorded_by: number;
  temperature: string | null;   // decimal as string, e.g. "37.1" (Celsius)
  heart_rate: number | null; oxygen_level: number | null;
  systolic_bp: number | null; diastolic_bp: number | null;
  pain_level: number; fatigue_level: number; appetite_level: number;
  recorded_at: string;          // ISO datetime, must NOT be in the future
  notes: string; created_at: string;
};

type SymptomRecord = {
  id: number; patient: number; patient_name: string; recorded_by: number;
  symptom_date: string;         // "YYYY-MM-DD", must NOT be in the future
  fever: boolean; nausea: boolean; vomiting: boolean; severe_pain: boolean;
  breathing_difficulty: boolean; dizziness: boolean; bleeding: boolean;
  fatigue: boolean; appetite_loss: boolean; infection_signs: boolean;
  symptom_severity_score: number; notes: string; created_at: string;
};

type EmergencyRequest = {
  id: number; patient: number; patient_name: string; triggered_by: number;
  emergency_type: string;       // default "urgent_help"
  message: string;
  status: "active" | "acknowledged" | "resolved" | "cancelled";
  created_at: string; acknowledged_by: number | null; resolved_at: string | null;
};

type AIRiskAssessment = {
  id: number; patient: number; patient_name: string; requested_by: number; requested_by_name: string;
  risk_score: number;           // 0–100
  risk_category: "low" | "medium" | "high" | "emergency";
  confidence: string | null;    // decimal as string
  confidence_explanation: string[];
  freshness_warnings: string[];
  risk_trend: { direction: string; message: string; previous_score: number | null; previous_category: string | null };
  reasons: string[];
  suggested_action: string; disclaimer: string;
  input_snapshot: Record<string, unknown>;
  model_version: string; rule_score: number; ml_score: number | null;
  created_alert: number | null; created_at: string;
};

type AuditLog = { id: number; user: number; user_email: string; action: string; metadata: Record<string, unknown>; created_at: string };
```

---

## 6. Endpoint reference (resource APIs, all under `/api`)

All resource collections are DRF viewsets. Standard pattern unless noted:
`GET /x/` (list), `POST /x/` (create), `GET /x/{id}/` (retrieve), `PATCH /x/{id}/` (update).

### Profiles
- `GET /profiles/patients/` → **plain array** of `PatientProfile`. (patient: self; caregiver: linked patients; admin: all)
- `PATCH /profiles/patients/{id}/` → update own profile (editable: age, gender, address, emergency_contact_*, cancer_type, treatment_stage, primary_hospital, doctor_name, notes).
- `GET /profiles/caregivers/` → paginated `CaregiverProfile`. (caregiver: self; admin: all)
- `PATCH /profiles/caregivers/{id}/` → update own profile.
- `user`, `full_name`, `email` are read-only on profiles.

### Caregiver linking
- `GET /caregiver-links/` → **plain array** of `CaregiverLink`.
- `POST /caregiver-links/` → (patient only) generate a new invite. Returns `CaregiverLink` with `invite_code`. No body needed.
- `POST /caregiver-links/accept/` → (caregiver only) body `{ invite_code }`. Activates the link.
- `POST /caregiver-links/{id}/revoke/` → (patient who owns it, or admin) revokes the link.

### Medications
- `GET /medications/?page=N` → paginated `Medication`.
- `POST /medications/` → (patient only) create. Required: `medicine_name`, `dosage`, `start_date`. `patient` is set server-side (do NOT send). `end_date` must be ≥ `start_date`.
- `PATCH /medications/{id}/` → (owning patient) update.
- `GET /medication-logs/?page=N` → paginated `MedicationLog`.
- `POST /medication-logs/` → (patient) body `{ medication, scheduled_datetime, status, notes? }`. Setting `status: "missed"` auto-creates a caregiver alert.
- `PATCH /medication-logs/{id}/` → update status etc. Changing status to `"missed"` triggers an alert. `marked_at` is set server-side when status changes.

### Appointments
- `GET /appointments/?page=N` → paginated `Appointment`.
- `POST /appointments/` → (patient only) body `{ title, date, time, appointment_type?, hospital_name?, doctor_name?, notes? }`. `patient` set server-side.
- `PATCH /appointments/{id}/` → update. Setting `status: "missed"` triggers an alert.

### Vitals / Symptoms (patient, caregiver-for-linked, or admin can create)
- `GET /vitals/?page=N` → paginated `VitalSign`.
- `POST /vitals/` → body of vital fields. For **patient**, omit `patient` (defaults to self). For **caregiver/admin**, include `patient: <id>`. `recorded_at` required, not future. Validation ranges: temperature 30–45, heart_rate 30–220, oxygen 0–100, systolic 60–260, diastolic 40–180, pain/fatigue/appetite 0–10. Out-of-range vitals (e.g. oxygen <92, temp ≥38.5, pain ≥8) auto-create alerts.
- `GET /symptoms/?page=N` → paginated `SymptomRecord`.
- `POST /symptoms/` → boolean symptom flags + `symptom_date` (not future) + `symptom_severity_score` (0–10). Same patient rule as vitals. Breathing difficulty/bleeding → emergency alert; severe pain or (fever+infection) → high alert.

### Emergencies
- `GET /emergencies/?page=N` → paginated `EmergencyRequest`.
- `POST /emergencies/` → (patient only) body `{ emergency_type?, message? }`. Only one **active** emergency allowed at a time (409-style validation error otherwise). Auto-creates an emergency-severity alert.
- `POST /emergencies/{id}/acknowledge/` → (caregiver/admin).
- `POST /emergencies/{id}/resolve/` → (caregiver/admin).

### Alerts (read-only fields; only status changes via actions)
- `GET /alerts/?page=N` → paginated `Alert`, ordered by severity then newest. (patient: own; caregiver: linked patients' alerts addressed to them or unassigned; admin: all)
- `POST /alerts/{id}/acknowledge/` → (caregiver/admin) body `{ note? }`.
- `POST /alerts/{id}/resolve/` → (caregiver/admin) body `{ note? }`.

### Notifications
- `GET /notifications/?page=N` → paginated `Notification` (recipient = current user).
- `PATCH /notifications/{id}/` → body `{ is_read: true }`.
- `POST /notifications/mark-all-read/` → marks all read, returns `{ ok: true }`.

### AI risk assessment
- `GET /ai-assessments/?page=N` → paginated `AIRiskAssessment` history.
- `POST /ai-assessments/` → run a new assessment. **patient**: send `{}` (assesses self). **caregiver/admin**: send `{ patient: <id> }`. Returns the full `AIRiskAssessment` (score, category, reasons[], suggested_action, disclaimer, risk_trend). **Always display the `disclaimer`.** High/emergency categories auto-create an alert.

### Admin only
- `GET /admin/users/?page=N` → paginated `User`.
- `PATCH /admin/users/{id}/` → update `full_name`, `phone`, `is_active` (email/role read-only).
- `GET /admin/audit-logs/?page=N` → paginated `AuditLog` (read-only).

---

## 7. Screens to build (map to mockup + roles)

Build a public landing page styled like the mockup (hero, four feature cards: AI Symptom & Vitals
Check, Medication Reminders, Upcoming Appointments, Caregiver Support; trust strip; testimonial;
footer). The CTAs ("Get Started" / "Sign In") route to register/login.

Authenticated app (same visual language as landing):

- **Patient** (`/patient/today` home): today's medications with mark Taken/Missed/Skipped; upcoming appointments; quick "log vitals", "log symptoms", "run AI check", and a prominent **Emergency** button; recent alerts/notifications. Sub-pages for full medication list/create, appointments list/create, vitals & symptoms history (with charts), AI assessment history, profile, and caregiver invite-code management.
- **Caregiver** (`/caregiver`): list of linked patients; per-patient alerts (acknowledge/resolve), vitals/symptoms view, AI assessments; an "accept invite code" form; emergency handling.
- **Admin** (`/admin`): users table (toggle active, edit name/phone) and audit log table.

Senior-friendly UX requirements: large fonts (≥18px body), high contrast, big buttons, clear
labels, minimal steps, confirm destructive/emergency actions, show loading and error states using
the API error messages from §2.

---

## 8. Hard rules for the agent (do not break the contract)

1. Never change endpoint paths, HTTP methods, or field names — the backend is frozen.
2. Always include the trailing slash on URLs.
3. Never send server-managed fields (`patient` on patient-created resources, `id`, `created_at`, `marked_at`, read-only profile fields, alert content fields).
4. Respect role permissions in the UI; the backend will 403 otherwise.
5. Treat `/profiles/patients/` and `/caregiver-links/` as plain arrays; treat all other lists as `{ count, next, previous, results }`.
6. Send dates as `YYYY-MM-DD`, times as `HH:MM`, datetimes as ISO 8601.
7. Always show the AI `disclaimer`. This is a demo support tool, not medical advice.
