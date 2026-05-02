import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader, StatusMessage } from "@/components/ui/feedback";
import { Input, Label, Select } from "@/components/ui/form";
import { apiErrorMessage, listAdminUsers, listAlerts, listAuditLogs, updateAdminUser, type Alert, type AuditLog, type Role, type User } from "@/lib/api";

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([listAdminUsers(), listAuditLogs(), listAlerts()])
      .then(([userData, logData, alertData]) => {
        setUsers(userData);
        setLogs(logData.slice(0, 6));
        setAlerts(alertData);
      })
      .catch((error) => setMessage(apiErrorMessage(error, "Could not load admin overview.")));
  }, []);

  const patientCount = users.filter((user) => user.role === "patient").length;
  const caregiverCount = users.filter((user) => user.role === "caregiver").length;
  const disabledCount = users.filter((user) => !user.is_active).length;
  const openAlerts = alerts.filter((alert) => alert.status === "open").length;
  const emergencyAlerts = alerts.filter((alert) => alert.severity === "emergency").length;

  return (
    <div className="grid gap-6">
      <PageHeader title="Admin overview" subtitle="A lightweight demo admin panel for users, alerts, and audit activity." />
      {message ? <StatusMessage message={message} tone="error" /> : null}
      <div className="grid gap-4 md:grid-cols-5">
        <Metric label="Patients" value={patientCount} />
        <Metric label="Caregivers" value={caregiverCount} />
        <Metric label="Disabled" value={disabledCount} />
        <Metric label="Open alerts" value={openAlerts} />
        <Metric label="Emergency alerts" value={emergencyAlerts} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Recent logs</CardTitle>
          <div className="mt-5 grid gap-3">
            {logs.length ? logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-[#d8cebd] bg-white p-4">
                <p className="font-black">{log.action.replaceAll("_", " ")}</p>
                <p className="font-semibold text-[#5b665f]">{log.user_email || "system"} · {new Date(log.created_at).toLocaleString()}</p>
              </div>
            )) : <EmptyState title="No audit logs" message="Login and care actions will appear here." />}
          </div>
        </Card>
        <Card>
          <CardTitle>Recent alerts</CardTitle>
          <div className="mt-5 grid gap-3">
            {alerts.slice(0, 6).map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-[#d8cebd] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-black">{alert.title}</p>
                  <Badge>{alert.severity} · {alert.status}</Badge>
                </div>
                <p className="mt-1 font-semibold text-[#5b665f]">{alert.patient_name} · {alert.message}</p>
              </div>
            ))}
            {!alerts.length ? <EmptyState title="No alerts" message="System alerts will appear here." /> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  const [status, setStatus] = useState<"all" | "active" | "disabled">("all");
  const [message, setMessage] = useState("");

  async function load() {
    setUsers(await listAdminUsers());
  }

  useEffect(() => {
    load().catch((error) => setMessage(apiErrorMessage(error, "Could not load users.")));
  }, []);

  async function toggleUser(user: User) {
    setMessage("");
    try {
      await updateAdminUser(user.id, { is_active: !user.is_active });
      setMessage(`${user.full_name} is now ${user.is_active ? "disabled" : "active"}.`);
      await load();
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not update user."));
    }
  }

  const filtered = users.filter((user) => {
    const search = `${user.full_name} ${user.email} ${user.phone}`.toLowerCase();
    const matchesQuery = !query || search.includes(query.toLowerCase());
    const matchesRole = role === "all" || user.role === role;
    const matchesStatus = status === "all" || (status === "active" ? user.is_active : !user.is_active);
    return matchesQuery && matchesRole && matchesStatus;
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="Users" subtitle="Search, filter, and safely enable or disable demo users." />
      {message ? <StatusMessage message={message} tone={message.includes("Could not") ? "error" : "success"} /> : null}
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Label>Search<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, email, phone" /></Label>
          <Label>Role<Select value={role} onChange={(e) => setRole(e.target.value as "all" | Role)}><option value="all">All roles</option><option value="patient">Patients</option><option value="caregiver">Caregivers</option><option value="admin">Admins</option></Select></Label>
          <Label>Status<Select value={status} onChange={(e) => setStatus(e.target.value as "all" | "active" | "disabled")}><option value="all">All statuses</option><option value="active">Active</option><option value="disabled">Disabled</option></Select></Label>
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-separate border-spacing-y-3 text-left">
            <thead>
              <tr className="text-sm uppercase text-[#5b665f]">
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="bg-white text-lg font-semibold">
                  <td className="rounded-l-2xl p-4">{user.full_name}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4"><Badge>{user.role}</Badge></td>
                  <td className="p-4">{user.is_active ? "Active" : "Disabled"}</td>
                  <td className="rounded-r-2xl p-4">
                    <Button type="button" variant={user.is_active ? "danger" : "secondary"} onClick={() => toggleUser(user)} disabled={user.role === "admin"}>
                      {user.is_active ? "Disable" : "Enable"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length ? <EmptyState title="No users found" message="Try a different search or filter." /> : null}
        </div>
      </Card>
    </div>
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
