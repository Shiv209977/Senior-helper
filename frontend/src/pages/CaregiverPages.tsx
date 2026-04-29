import { Bell, CheckCircle2, Link2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form";
import { api } from "@/lib/api";

type LinkRecord = { id: number; patient: number; patient_name: string; status: string; invite_code: string };
type Alert = { id: number; patient_name: string; title: string; message: string; severity: string; status: string; created_at: string };

export function CaregiverDashboard() {
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [inviteCode, setInviteCode] = useState("");

  async function load() {
    const [linkRes, alertRes] = await Promise.all([api.get("/caregiver-links/"), api.get("/alerts/")]);
    setLinks(linkRes.data);
    setAlerts(alertRes.data.slice(0, 5));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function accept(event: FormEvent) {
    event.preventDefault();
    await api.post("/caregiver-links/accept/", { invite_code: inviteCode });
    setInviteCode("");
    await load();
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardTitle>Caregiver dashboard</CardTitle>
        <p className="mt-2 text-xl font-semibold text-[#5b665f]">Monitor linked patients, alerts, and emergency requests from one calm place.</p>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardTitle>Link a patient</CardTitle>
          <form className="mt-5 flex flex-col gap-4" onSubmit={accept}>
            <Label>Invite code<Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="Example: A1B2C3D4" required /></Label>
            <Button type="submit"><Link2 aria-hidden /> Accept invite</Button>
          </form>
          <div className="mt-6 grid gap-3">
            <h3 className="text-xl font-black">Linked patients</h3>
            {links.length ? links.map((link) => (
              <div key={link.id} className="rounded-2xl border border-[#d8cebd] bg-white p-4">
                <p className="text-lg font-black">{link.patient_name}</p>
                <Badge>{link.status}</Badge>
              </div>
            )) : <p className="text-lg text-[#5b665f]">No linked patients yet.</p>}
          </div>
        </Card>
        <AlertList alerts={alerts} onChange={load} />
      </div>
    </div>
  );
}

export function CaregiverAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  async function load() {
    const { data } = await api.get("/alerts/");
    setAlerts(data);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  return <AlertList alerts={alerts} onChange={load} />;
}

function AlertList({ alerts, onChange }: { alerts: Alert[]; onChange: () => Promise<void> }) {
  async function acknowledge(id: number) {
    await api.post(`/alerts/${id}/acknowledge/`, {});
    await onChange();
  }

  async function resolve(id: number) {
    await api.post(`/alerts/${id}/resolve/`, {});
    await onChange();
  }

  return (
    <Card>
      <CardTitle>Caregiver alerts</CardTitle>
      <div className="mt-5 grid gap-4">
        {alerts.length ? alerts.map((alert) => (
          <div key={alert.id} className="rounded-3xl border border-[#d8cebd] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black">{alert.title}</h3>
                <p className="font-semibold text-[#5b665f]">{alert.patient_name} · {alert.message}</p>
              </div>
              <Badge className={alert.severity === "emergency" ? "bg-red-100 text-red-800" : ""}>{alert.severity} · {alert.status}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => acknowledge(alert.id)}><Bell aria-hidden /> Acknowledge</Button>
              <Button variant="primary" onClick={() => resolve(alert.id)}><CheckCircle2 aria-hidden /> Resolve</Button>
            </div>
          </div>
        )) : <p className="text-lg text-[#5b665f]">No alerts yet.</p>}
      </div>
    </Card>
  );
}

