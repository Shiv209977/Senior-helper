import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { AdminDashboard, AdminUsersPage } from "@/pages/AdminPages";
import { LoginPage, RegisterPage } from "@/pages/AuthPages";
import { CaregiverAlertsPage, CaregiverDashboard } from "@/pages/CaregiverPages";
import { PatientAppointmentsPage, PatientDashboard, PatientHealthPage, PatientMedicationsPage } from "@/pages/PatientPages";
import { dashboardPath } from "@/lib/api";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to={user ? dashboardPath(user.role) : "/login"} replace />} />
      <Route path="/patient" element={<ProtectedPage role="patient"><PatientDashboard /></ProtectedPage>} />
      <Route path="/patient/medications" element={<ProtectedPage role="patient"><PatientMedicationsPage /></ProtectedPage>} />
      <Route path="/patient/appointments" element={<ProtectedPage role="patient"><PatientAppointmentsPage /></ProtectedPage>} />
      <Route path="/patient/health" element={<ProtectedPage role="patient"><PatientHealthPage /></ProtectedPage>} />
      <Route path="/caregiver" element={<ProtectedPage role="caregiver"><CaregiverDashboard /></ProtectedPage>} />
      <Route path="/caregiver/alerts" element={<ProtectedPage role="caregiver"><CaregiverAlertsPage /></ProtectedPage>} />
      <Route path="/admin" element={<ProtectedPage role="admin"><AdminDashboard /></ProtectedPage>} />
      <Route path="/admin/users" element={<ProtectedPage role="admin"><AdminUsersPage /></ProtectedPage>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ProtectedPage({ role, children }: { role: "patient" | "caregiver" | "admin"; children: ReactNode }) {
  return (
    <ProtectedRoute role={role}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
