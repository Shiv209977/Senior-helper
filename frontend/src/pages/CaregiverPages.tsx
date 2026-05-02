import { Bell, Brain, CheckCircle2, Link2, Siren } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState, LoadingState, PageHeader, SectionTitle, StatusMessage } from "@/components/ui/feedback";
import { Input, Label } from "@/components/ui/form";
import {
  acceptCaregiverInvite,
  acknowledgeAlert,
  acknowledgeEmergency,
  apiErrorMessage,
  listAlerts,
  listAppointments,
  listAssessments,
  listCaregiverLinks,
  listEmergencies,
  listMedications,
  listSymptoms,
  listVitals,
  resolveAlert,
  resolveEmergency,
  runAssessment,
  type AIRiskAssessment,
  type Alert,
  type Appointment,
  type CaregiverLink,
  type EmergencyRequest,
  type Medication,
  type SymptomRecord,
  type VitalSign,
} from "@/lib/api";

type CaregiverData = {
  links: CaregiverLink[];
  alerts: Alert[];
  medications: Medication[];
  appointments: Appointment[];
  vitals: VitalSign[];
  symptoms: SymptomRecord[];
  assessments: AIRiskAssessment[];
  emergencies: EmergencyRequest[];
};

const emptyData: CaregiverData = { links: [], alerts: [], medications: [], appointments: [], vitals: [], symptoms: [], assessments: [], emergencies: [] };

export function CaregiverDashboard() {
  const [data, setData] = useState<CaregiverData>(emptyData);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    const [links, alerts, medications, appointments, vitals, symptoms, assessments, emergencies] = await Promise.all([
      listCaregiverLinks(),
      listAlerts(),
      listMedications(),
      listAppointments(),
      listVitals(),
      listSymptoms(),
      listAssessments(),
      listEmergencies(),
    ]);
    setData({ links, alerts, medications, appointments, vitals, symptoms, assessments, emergencies });
  }

  useEffect(() => {
    load()
      .catch((error) => setMessage(apiErrorMessage(error, "Could not load caregiver dashboard.")))
      .finally(() => setLoading(false));
  }, []);

  async function accept(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await acceptCaregiverInvite(inviteCode);
      setInviteCode("");
      setMessage("Patient linked successfully.");
      await load();
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not accept invite code."));
    }
  }

  async function runLinkedAssessment(patient: number) {
    setMessage("");
    try {
      await runAssessment(patient);
      setMessage("Linked-patient AI risk assessment completed.");
      await load();
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not run assessment for this patient."));
    }
  }

  if (loading) return <LoadingState label="Loading caregiver dashboard..." />;

  return (
    <div className="grid gap-6">
      <PageHeader title="Caregiver dashboard" subtitle="Monitor linked patients, alerts, health history, and emergency requests from one calm place." />
      {message ? <StatusMessage message={message} tone={message.includes("Could not") ? "error" : "success"} /> : null}
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardTitle>Link a patient</CardTitle>
          <form className="mt-5 flex flex-col gap-4" onSubmit={accept}>
            <Label>Invite code<Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="Example: A1B2C3D4" required /></Label>
            <Button type="submit"><Link2 aria-hidden /> Accept invite</Button>
          </form>
          <div className="mt-6 grid gap-3">
            <h3 className="text-xl font-black">Linked patients</h3>
            {data.links.length ? data.links.map((link) => (
              <div key={link.id} className="rounded-2xl border border-[#d8cebd] bg-white p-4">
                <p className="text-lg font-black">{link.patient_name}</p>
                <Badge>{link.status}</Badge>
              </div>
            )) : <EmptyState title="No linked patients" message="Ask the patient to generate an invite code from their dashboard." />}
          </div>
        </Card>
        <AlertList alerts={data.alerts.slice(0, 5)} onChange={load} onMessage={setMessage} />
      </div>
      <div className="grid gap-6">
        {data.links.length ? data.links.map((link) => (
          <PatientOverview key={link.id} link={link} data={data} onRunAssessment={() => runLinkedAssessment(link.patient)} onChange={load} onMessage={setMessage} />
        )) : null}
      </div>
    </div>
  );
}

export function CaregiverAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    setAlerts(await listAlerts());
  }

  useEffect(() => {
    load().catch((error) => setMessage(apiErrorMessage(error, "Could not load alerts.")));
  }, []);

  return (
    <div className="grid gap-6">
      <PageHeader title="Caregiver alerts" subtitle="Acknowledge what you have seen and resolve items after action is complete." />
      {message ? <StatusMessage message={message} tone="error" /> : null}
      <AlertList alerts={alerts} onChange={load} onMessage={setMessage} />
    </div>
  );
}

function PatientOverview({
  link,
  data,
  onRunAssessment,
  onChange,
  onMessage,
}: {
  link: CaregiverLink;
  data: CaregiverData;
  onRunAssessment: () => Promise<void>;
  onChange: () => Promise<void>;
  onMessage: (message: string) => void;
}) {
  const patientId = link.patient;
  const medications = data.medications.filter((item) => item.patient === patientId).slice(0, 4);
  const appointments = data.appointments.filter((item) => item.patient === patientId).slice(0, 4);
  const vitals = data.vitals.filter((item) => item.patient === patientId).slice(0, 3);
  const symptoms = data.symptoms.filter((item) => item.patient === patientId).slice(0, 3);
  const assessments = data.assessments.filter((item) => item.patient === patientId).slice(0, 3);
  const emergencies = data.emergencies.filter((item) => item.patient === patientId).slice(0, 3);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle title={link.patient_name} subtitle="Linked patient care summary. AI check reads latest vitals, symptoms, missed medicines, missed appointments, and emergencies, then saves a supportive risk score." />
        <Button onClick={onRunAssessment}><Brain aria-hidden /> Run AI check</Button>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <MiniList title="Medications" items={medications.map((item) => `${item.medicine_name} · ${item.dosage} · ${item.is_active ? "active" : "disabled"}`)} />
        <MiniList title="Appointments" items={appointments.map((item) => `${item.date} ${item.time} · ${item.title} · ${item.status}`)} />
        <MiniList title="Vitals" items={vitals.map((item) => `${formatDateTime(item.recorded_at)} · O2 ${item.oxygen_level ?? "n/a"} · pain ${item.pain_level}`)} />
        <MiniList title="Symptoms" items={symptoms.map((item) => `${item.symptom_date} · severity ${item.symptom_severity_score}`)} />
        <MiniList title="AI history" items={assessments.map((item) => `${formatDateTime(item.created_at)} · ${item.risk_category} · ${item.risk_score}/100`)} />
        <EmergencyList emergencies={emergencies} onChange={onChange} onMessage={onMessage} />
      </div>
    </Card>
  );
}

function AlertList({ alerts, onChange, onMessage }: { alerts: Alert[]; onChange: () => Promise<void>; onMessage: (message: string) => void }) {
  async function acknowledge(id: number) {
    onMessage("");
    try {
      await acknowledgeAlert(id);
      onMessage("Alert acknowledged.");
      await onChange();
    } catch (error) {
      onMessage(apiErrorMessage(error, "Could not acknowledge alert."));
    }
  }

  async function resolve(id: number) {
    onMessage("");
    try {
      await resolveAlert(id);
      onMessage("Alert resolved.");
      await onChange();
    } catch (error) {
      onMessage(apiErrorMessage(error, "Could not resolve alert."));
    }
  }

  return (
    <Card>
      <CardTitle>Alerts</CardTitle>
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
        )) : <EmptyState title="No alerts" message="Linked patient alerts will appear here." />}
      </div>
    </Card>
  );
}

function EmergencyList({ emergencies, onChange, onMessage }: { emergencies: EmergencyRequest[]; onChange: () => Promise<void>; onMessage: (message: string) => void }) {
  async function acknowledge(id: number) {
    onMessage("");
    try {
      await acknowledgeEmergency(id);
      onMessage("Emergency request acknowledged.");
      await onChange();
    } catch (error) {
      onMessage(apiErrorMessage(error, "Could not acknowledge emergency request."));
    }
  }

  async function resolve(id: number) {
    onMessage("");
    try {
      await resolveEmergency(id);
      onMessage("Emergency request resolved.");
      await onChange();
    } catch (error) {
      onMessage(apiErrorMessage(error, "Could not resolve emergency request."));
    }
  }

  return (
    <div className="rounded-3xl border border-[#d8cebd] bg-white p-4">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><Siren size={20} aria-hidden /> Emergency requests</h3>
      <div className="grid gap-3">
        {emergencies.length ? emergencies.map((item) => (
          <div key={item.id} className="rounded-2xl bg-[#f7f2e8] p-3">
            <p className="font-bold">{formatDateTime(item.created_at)} · {item.status}</p>
            <p className="font-semibold text-[#5b665f]">{item.message || "Urgent help requested"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => acknowledge(item.id)}>Acknowledge</Button>
              <Button onClick={() => resolve(item.id)}>Resolve</Button>
            </div>
          </div>
        )) : <p className="font-semibold text-[#5b665f]">No emergency requests.</p>}
      </div>
    </div>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-[#d8cebd] bg-white p-4">
      <h3 className="mb-3 text-lg font-black">{title}</h3>
      <div className="grid gap-2">
        {items.length ? items.map((item) => <p key={item} className="font-semibold text-[#5b665f]">{item}</p>) : <p className="font-semibold text-[#5b665f]">Nothing recorded yet.</p>}
      </div>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}
