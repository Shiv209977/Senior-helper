# Senior Care Companion

Web-based senior-friendly cancer care support demo with Django REST Framework, React, Vite, role-based dashboards, medication and appointment tracking, caregiver alerts, emergency requests, and AI-assisted symptom/vitals risk assessment.

## Local Setup

Backend:

```bash
cd backend
cp .env.example .env
.venv/bin/python manage.py migrate
.venv/bin/python manage.py create_demo_users
.venv/bin/python manage.py runserver
```

Frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`.

## Demo Accounts

All demo accounts use password `Password123!`.

| Role | Email |
|---|---|
| Patient | `patient@example.com` |
| Caregiver | `caregiver@example.com` |
| Admin | `admin@example.com` |

The seed command is idempotent and creates a patient, caregiver, admin, active caregiver link, medications, appointment, vitals, symptoms, missed-dose alert, and an initial AI assessment record.

## Verification

Backend:

```bash
cd backend
.venv/bin/python manage.py check
.venv/bin/python manage.py makemigrations --check --dry-run
.venv/bin/python manage.py test
```

Frontend:

```bash
cd frontend
npm run build
npm run lint
```

## Safety Note

The AI module provides supportive risk assessment based on patient-entered data. It is not a medical diagnosis and should not replace advice from a qualified doctor.
