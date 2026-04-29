import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { api, type User } from "@/lib/api";

type AuditLog = { id: number; user_email: string; action: string; created_at: string };
type Alert = { id: number; title: string; severity: string; status: string };

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    Promise.all([api.get("/admin/users/"), api.get("/admin/audit-logs/"), api.get("/alerts/")])
      .then(([userRes, logRes, alertRes]) => {
        setUsers(userRes.data);
        setLogs(logRes.data.slice(0, 5));
        setAlerts(alertRes.data);
      })
      .catch(() => undefined);
  }, []);

  const patientCount = users.filter((user) => user.role === "patient").length;
  const caregiverCount = users.filter((user) => user.role === "caregiver").length;
  const openAlerts = alerts.filter((alert) => alert.status === "open").length;

  return (
    <div className="grid gap-6">
      <Card>
        <CardTitle>Admin overview</CardTitle>
        <p className="mt-2 text-xl font-semibold text-[#5b665f]">A lightweight demo admin panel for users, alerts, and audit activity.</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Patients" value={patientCount} />
        <Metric label="Caregivers" value={caregiverCount} />
        <Metric label="Open alerts" value={openAlerts} />
      </div>
      <Card>
        <CardTitle>Recent logs</CardTitle>
        <div className="mt-5 grid gap-3">
          {logs.length ? logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-[#d8cebd] bg-white p-4">
              <p className="font-black">{log.action.replaceAll("_", " ")}</p>
              <p className="font-semibold text-[#5b665f]">{log.user_email || "system"} · {new Date(log.created_at).toLocaleString()}</p>
            </div>
          )) : <p className="text-lg text-[#5b665f]">No audit logs yet.</p>}
        </div>
      </Card>
    </div>
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api.get("/admin/users/").then(({ data }) => setUsers(data)).catch(() => undefined);
  }, []);

  return (
    <Card>
      <CardTitle>Users</CardTitle>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-3 text-left">
          <thead>
            <tr className="text-sm uppercase text-[#5b665f]">
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="bg-white text-lg font-semibold">
                <td className="rounded-l-2xl p-4">{user.full_name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4"><Badge>{user.role}</Badge></td>
                <td className="rounded-r-2xl p-4">{user.is_active ? "Active" : "Disabled"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-base font-black uppercase tracking-wide text-[#5b665f]">{label}</p>
      <p className="mt-2 text-5xl font-black text-[#21473e]">{value}</p>
    </Card>
  );
}

