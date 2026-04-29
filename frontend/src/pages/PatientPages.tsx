import { AlertTriangle, Brain, CalendarDays, HeartPulse, Pill, Siren } from "lucide-react";
import { FormEvent, useEffect, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { api } from "@/lib/api";

type Medication = { id: number; medicine_name: string; dosage: string; frequency_type: string; scheduled_times: string[]; start_date: string; is_active: boolean };
type Appointment = { id: number; title: string; date: string; time: string; status: string; appointment_type: string };
type Alert = { id: number; title: string; message: string; severity: string; status: string; created_at: string };
type Assessment = { id: number; risk_category: string; risk_score: number; reasons: string[]; suggested_action: string; disclaimer: string; created_at: string };

export function PatientDashboard() {
  const [invite, setInvite] = useState<string>("");
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    api.get("/alerts/").then(({ data }) => setAlerts(data.slice(0, 4))).catch(() => undefined);
  }, []);

  async function generateInvite() {
    const { data } = await api.post("/caregiver-links/");
    setInvite(data.invite_code);
  }

  return (
    <div className="grid gap-6">
      <Hero title="Patient dashboard" subtitle="A simple daily view for treatment routines, care alerts, and emergency help." />
      <div className="grid gap-5 lg:grid-cols-3">
        <QuickCard icon={<Pill />} title="Medication" text="Add treatment schedules and mark doses." href="/patient/medications" />
        <QuickCard icon={<CalendarDays />} title="Appointments" text="Track doctor visits and treatment dates." href="/patient/appointments" />
        <QuickCard icon={<Brain />} title="Health + AI" text="Enter vitals, symptoms, and run a safe risk check." href="/patient/health" />
      </div>
      <Card>
        <CardTitle>Caregiver invite</CardTitle>
        <p className="mt-2 text-lg text-[#5b665f]">Share this code with a caregiver so they can monitor alerts for you.</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button onClick={generateInvite}>Generate invite code</Button>
          {invite ? <span className="rounded-2xl bg-[#f2c66d] px-5 py-3 text-2xl font-black tracking-widest">{invite}</span> : null}
        </div>
      </Card>
      <Card>
        <CardTitle>Recent alerts</CardTitle>
        <div className="mt-4 grid gap-3">
          {alerts.length ? alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />) : <p className="text-lg text-[#5b665f]">No alerts yet. Quiet dashboard, happy dashboard.</p>}
        </div>
      </Card>
    </div>
  );
}

export function PatientMedicationsPage() {
  const [items, setItems] = useState<Medication[]>([]);
  const [form, setForm] = useState({ medicine_name: "", dosage: "", frequency_type: "once_daily", scheduled_times: "09:00", start_date: new Date().toISOString().slice(0, 10), instructions: "" });

  async function load() {
    const { data } = await api.get("/medications/");
    setItems(data);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api.post("/medications/", { ...form, scheduled_times: form.scheduled_times.split(",").map((item) => item.trim()).filter(Boolean) });
    setForm({ ...form, medicine_name: "", dosage: "", instructions: "" });
    await load();
  }

  async function mark(medication: Medication, status: string) {
    const scheduled = new Date();
    await api.post("/medication-logs/", { medication: medication.id, scheduled_datetime: scheduled.toISOString(), status });
    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardTitle>Add medication</CardTitle>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <Label>Medicine name<Input value={form.medicine_name} onChange={(e) => setForm({ ...form, medicine_name: e.target.value })} required /></Label>
          <Label>Dosage<Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} required /></Label>
          <Label>Frequency<Select value={form.frequency_type} onChange={(e) => setForm({ ...form, frequency_type: e.target.value })}><option value="once_daily">Once daily</option><option value="twice_daily">Twice daily</option><option value="custom">Custom</option></Select></Label>
          <Label>Scheduled times<Input value={form.scheduled_times} onChange={(e) => setForm({ ...form, scheduled_times: e.target.value })} placeholder="09:00, 21:00" /></Label>
          <Label>Start date<Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></Label>
          <Label>Instructions<Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></Label>
          <Button type="submit">Save medication</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Medication list</CardTitle>
        <div className="mt-5 grid gap-4">
          {items.length ? items.map((item) => (
            <div key={item.id} className="rounded-3xl border border-[#d8cebd] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">{item.medicine_name}</h3>
                  <p className="font-semibold text-[#5b665f]">{item.dosage} · {item.frequency_type.replace("_", " ")}</p>
                </div>
                <Badge>{item.is_active ? "Active" : "Disabled"}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["taken", "missed", "skipped", "delayed"].map((status) => (
                  <Button key={status} type="button" variant={status === "missed" ? "danger" : "secondary"} onClick={() => mark(item, status)}>
                    Mark {status}
                  </Button>
                ))}
              </div>
            </div>
          )) : <p className="text-lg text-[#5b665f]">No medications yet.</p>}
        </div>
      </Card>
    </div>
  );
}

export function PatientAppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [form, setForm] = useState({ title: "", appointment_type: "consultation", hospital_name: "", doctor_name: "", date: new Date().toISOString().slice(0, 10), time: "10:00", notes: "" });

  async function load() {
    const { data } = await api.get("/appointments/");
    setItems(data);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api.post("/appointments/", form);
    setForm({ ...form, title: "", notes: "" });
    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardTitle>Add appointment</CardTitle>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <Label>Title<Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Label>
          <Label>Type<Select value={form.appointment_type} onChange={(e) => setForm({ ...form, appointment_type: e.target.value })}><option value="consultation">Consultation</option><option value="treatment">Treatment</option><option value="scan">Scan</option><option value="lab_test">Lab test</option><option value="follow_up">Follow up</option></Select></Label>
          <Label>Hospital<Input value={form.hospital_name} onChange={(e) => setForm({ ...form, hospital_name: e.target.value })} /></Label>
          <Label>Doctor<Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} /></Label>
          <Label>Date<Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></Label>
          <Label>Time<Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></Label>
          <Button type="submit">Save appointment</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Appointments</CardTitle>
        <div className="mt-5 grid gap-3">
          {items.length ? items.map((item) => (
            <div key={item.id} className="rounded-3xl border border-[#d8cebd] bg-white p-4">
              <h3 className="text-xl font-black">{item.title}</h3>
              <p className="font-semibold text-[#5b665f]">{item.date} at {item.time} · {item.appointment_type}</p>
              <Badge>{item.status}</Badge>
            </div>
          )) : <p className="text-lg text-[#5b665f]">No appointments yet.</p>}
        </div>
      </Card>
    </div>
  );
}

export function PatientHealthPage() {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [vitals, setVitals] = useState({ temperature: "37.0", heart_rate: "82", oxygen_level: "98", systolic_bp: "120", diastolic_bp: "80", pain_level: "2", fatigue_level: "2", appetite_level: "6", notes: "" });
  const [symptoms, setSymptoms] = useState({ fever: false, nausea: false, vomiting: false, severe_pain: false, breathing_difficulty: false, dizziness: false, bleeding: false, fatigue: false, appetite_loss: false, infection_signs: false, symptom_severity_score: "0", notes: "" });

  async function saveVitals(event: FormEvent) {
    event.preventDefault();
    await api.post("/vitals/", {
      ...numberPayload(vitals),
      recorded_at: new Date().toISOString(),
    });
  }

  async function saveSymptoms(event: FormEvent) {
    event.preventDefault();
    await api.post("/symptoms/", {
      ...symptoms,
      symptom_severity_score: Number(symptoms.symptom_severity_score),
      symptom_date: new Date().toISOString().slice(0, 10),
    });
  }

  async function runAssessment() {
    const { data } = await api.post("/ai-assessments/", {});
    setAssessment(data);
  }

  async function triggerEmergency() {
    await api.post("/emergencies/", { emergency_type: "urgent_help", message: "Patient requested urgent caregiver support." });
  }

  return (
    <div className="grid gap-6">
      <Card className="border-[#b6422c]/35">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Health monitoring and AI risk check</CardTitle>
            <p className="mt-2 text-lg text-[#5b665f]">This is supportive risk assessment only. It is not a diagnosis.</p>
          </div>
          <Button variant="danger" onClick={triggerEmergency}><Siren aria-hidden /> Emergency request</Button>
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Add vitals</CardTitle>
          <form className="mt-5 grid gap-4" onSubmit={saveVitals}>
            {(["temperature", "heart_rate", "oxygen_level", "systolic_bp", "diastolic_bp", "pain_level", "fatigue_level", "appetite_level"] as const).map((key) => (
              <Label key={key}>{key.replaceAll("_", " ")}<Input value={vitals[key]} onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })} /></Label>
            ))}
            <Label>Notes<Textarea value={vitals.notes} onChange={(e) => setVitals({ ...vitals, notes: e.target.value })} /></Label>
            <Button type="submit">Save vitals</Button>
          </form>
        </Card>
        <Card>
          <CardTitle>Add symptoms</CardTitle>
          <form className="mt-5 grid gap-4" onSubmit={saveSymptoms}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["fever", "nausea", "vomiting", "severe_pain", "breathing_difficulty", "dizziness", "bleeding", "fatigue", "appetite_loss", "infection_signs"] as const).map((key) => (
                <label key={key} className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#d8cebd] bg-white px-4 text-lg font-bold">
                  <input type="checkbox" checked={symptoms[key]} onChange={(e) => setSymptoms({ ...symptoms, [key]: e.target.checked })} className="size-6" />
                  {key.replaceAll("_", " ")}
                </label>
              ))}
            </div>
            <Label>Severity score 0-10<Input value={symptoms.symptom_severity_score} onChange={(e) => setSymptoms({ ...symptoms, symptom_severity_score: e.target.value })} /></Label>
            <Label>Notes<Textarea value={symptoms.notes} onChange={(e) => setSymptoms({ ...symptoms, notes: e.target.value })} /></Label>
            <Button type="submit">Save symptoms</Button>
          </form>
        </Card>
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle>AI-assisted risk assessment</CardTitle>
          <Button onClick={runAssessment}><Brain aria-hidden /> Run risk check</Button>
        </div>
        {assessment ? (
          <div className="mt-5 rounded-3xl border border-[#d8cebd] bg-white p-5">
            <Badge className="text-lg">{assessment.risk_category.toUpperCase()} · {assessment.risk_score}/100</Badge>
            <ul className="mt-4 grid gap-2 text-lg font-semibold">
              {assessment.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
            </ul>
            <p className="mt-4 text-lg font-black">{assessment.suggested_action}</p>
            <p className="mt-3 rounded-2xl bg-[#f7f2e8] p-3 text-sm font-semibold text-[#5b665f]">{assessment.disclaimer}</p>
          </div>
        ) : <p className="mt-4 text-lg text-[#5b665f]">No assessment run in this session yet.</p>}
      </Card>
    </div>
  );
}

function Hero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#17211d]">{title}</h1>
          <p className="mt-3 max-w-3xl text-xl font-semibold text-[#5b665f]">{subtitle}</p>
        </div>
        <span className="grid size-20 place-items-center rounded-[2rem] bg-[#f2c66d] text-[#17211d]">
          <HeartPulse size={42} aria-hidden />
        </span>
      </div>
    </Card>
  );
}

function QuickCard({ icon, title, text, href }: { icon: ReactNode; title: string; text: string; href: string }) {
  return (
    <a href={href} className="senior-card rounded-3xl p-5 transition hover:-translate-y-1">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-[#e6f0ea] text-[#21473e]">{icon}</span>
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="mt-2 text-lg font-semibold text-[#5b665f]">{text}</p>
    </a>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#d8cebd] bg-white p-4">
      <AlertTriangle className="mt-1 text-[#b65f3a]" aria-hidden />
      <div>
        <h3 className="text-lg font-black">{alert.title}</h3>
        <p className="font-semibold text-[#5b665f]">{alert.message}</p>
      </div>
    </div>
  );
}

function numberPayload(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, key === "notes" ? value : Number(value)]));
}
