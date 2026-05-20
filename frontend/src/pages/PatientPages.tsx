import { AlertTriangle, Brain, CalendarDays, Pill, Siren, UserRound, Heart, Stethoscope, Activity } from "lucide-react";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState, LoadingState, PageHeader, SectionTitle, StatusMessage } from "@/components/ui/feedback";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import {
  apiErrorMessage,
  createAppointment,
  createCaregiverInvite,
  createEmergency,
  createMedication,
  createMedicationLog,
  createSymptoms,
  createVitals,
  listAlerts,
  listAppointments,
  listAssessments,
  listEmergencies,
  listMedicationLogs,
  listMedications,
  listPatientProfiles,
  listSymptoms,
  listVitals,
  runAssessment,
  updateAppointment,
  updateMedication,
  updateMedicationLog,
  updatePatientProfile,
  type AIRiskAssessment,
  type Alert,
  type Appointment,
  type EmergencyRequest,
  type Medication,
  type MedicationLog,
  type PatientProfile,
  type SymptomRecord,
  type VitalSign,
} from "@/lib/api";
import { VitalsChart } from "@/components/charts/VitalsChart";
import { RiskTrendChart } from "@/components/charts/RiskTrendChart";

const today = () => new Date().toISOString().slice(0, 10);

export function PatientDashboard() {
  const [invite, setInvite] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [assessments, setAssessments] = useState<AIRiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([listAlerts(), listVitals(), listAssessments()])
      .then(([alertData, vitalData, assessmentData]) => {
        setAlerts(alertData.results.slice(0, 4));
        setVitals(vitalData.results.slice(0, 20));
        setAssessments(assessmentData.results.slice(0, 20));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  async function generateInvite() {
    setMessage("");
    try {
      const data = await createCaregiverInvite();
      setInvite(data.invite_code);
      setMessage("Invite code generated. Share it only with your caregiver.");
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not create invite code."));
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Patient dashboard" subtitle="A simple daily view for treatment routines, care alerts, and emergency help." />
      <div className="grid gap-5 lg:grid-cols-4">
        <QuickCard icon={<UserRound />} title="Profile" text="Update care and emergency contact details." href="/patient/profile" />
        <QuickCard icon={<Pill />} title="Medication" text="Add treatment schedules and mark doses." href="/patient/medications" />
        <QuickCard icon={<CalendarDays />} title="Appointments" text="Track doctor visits and treatment dates." href="/patient/appointments" />
        <QuickCard icon={<Brain />} title="Health + AI" text="Enter vitals, symptoms, and run a safe risk check." href="/patient/health" />
      </div>
      <Card>
        <SectionTitle title="Caregiver invite" subtitle="Share this code with a caregiver so they can monitor alerts for you." />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button onClick={generateInvite}>Generate invite code</Button>
          {invite ? <span className="rounded-2xl bg-[#f2c66d] px-5 py-3 text-2xl font-black tracking-widest">{invite}</span> : null}
        </div>
        {message ? <div className="mt-4"><StatusMessage message={message} tone={message.includes("Could not") ? "error" : "success"} /></div> : null}
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Health trends</CardTitle>
          <div className="mt-4"><VitalsChart vitals={vitals} /></div>
        </Card>
        <Card>
          <CardTitle>AI risk history</CardTitle>
          <div className="mt-4"><RiskTrendChart assessments={assessments} /></div>
        </Card>
      </div>
      <Card>
        <CardTitle>Recent alerts</CardTitle>
        <div className="mt-4 grid gap-3">
          {loading ? <LoadingState label="Loading recent alerts..." /> : alerts.length ? alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />) : <EmptyState title="No alerts yet" message="Quiet dashboard, happy dashboard." />}
        </div>
      </Card>
    </div>
  );
}

export function TodayPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [assessment, setAssessment] = useState<AIRiskAssessment | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [meds, logData, appts, assessData] = await Promise.all([
      listMedications(),
      listMedicationLogs(),
      listAppointments(),
      listAssessments(),
    ]);
    const todayStr = today();
    setMedications(meds.results.filter((m) => m.is_active));
    setLogs(logData.results.filter((l) => sameLocalDate(l.scheduled_datetime, new Date())));
    setAppointments(appts.results.filter((a) => a.date === todayStr));
    setAssessment(assessData.results[0] ?? null);
  }

  useEffect(() => {
    load()
      .catch((error) => setMessage(apiErrorMessage(error, "Could not load today's care checklist.")))
      .finally(() => setLoading(false));
  }, []);

  async function markDose(medication: Medication, statusValue: string) {
    setMessage("");
    try {
      const scheduled = scheduledDateTimeForToday(medication);
      const existing = logs.find((log) => log.medication === medication.id && sameLocalDate(log.scheduled_datetime, scheduled));
      if (existing) {
        await updateMedicationLog(existing.id, { status: statusValue });
      } else {
        await createMedicationLog({ medication: medication.id, scheduled_datetime: scheduled.toISOString(), status: statusValue });
      }
      setMessage(`Dose marked ${statusValue}.`);
      await load();
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not mark dose."));
    }
  }

  async function handleEmergency() {
    setMessage("");
    try {
      await createEmergency({ emergency_type: "urgent_help", message: "Patient requested urgent caregiver support." });
      setMessage("Emergency request created. Linked caregivers can see and acknowledge it.");
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not create emergency request."));
    }
  }

  async function handleRunAI() {
    setMessage("");
    try {
      const data = await runAssessment();
      setAssessment(data);
      setMessage("AI-assisted risk check completed.");
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not run risk check."));
    }
  }

  if (loading) return <LoadingState label="Loading today's checklist..." />;

  const pendingDoses = logs.filter((l) => l.status === "pending");
  const takenDoses = logs.filter((l) => l.status === "taken");

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Today's care checklist"
        subtitle="Everything you need today in one place. Stay on top of medications, appointments, and health checks."
      />
      {message ? <StatusMessage message={message} tone={message.includes("Could not") ? "error" : "success"} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <QuickActionCard icon={<Pill />} title="Medications" count={`${takenDoses.length}/${logs.length || medications.length * (medications[0]?.scheduled_times?.length || 1)} taken`} href="/patient/medications" />
        <QuickActionCard icon={<CalendarDays />} title="Appointments" count={`${appointments.length} today`} href="/patient/appointments" />
        <QuickActionCard icon={<Activity />} title="Health + Vitals" count="Record now" href="/patient/health" />
      </div>

      <Card>
        <SectionTitle title="Today's medicines" subtitle="Mark each dose after you take it." />
        <div className="mt-5 grid gap-4">
          {medications.length ? medications.map((med) => {
            const doseLog = logs.find((l) => l.medication === med.id);
            const status = doseLog?.status ?? "pending";
            return (
              <div key={med.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#d8cebd] bg-white p-5">
                <div>
                  <h3 className="text-xl font-black">{med.medicine_name}</h3>
                  <p className="text-lg font-semibold text-[#5b665f]">{med.dosage} · {med.scheduled_times.join(", ")}</p>
                  {med.instructions ? <p className="mt-1 font-semibold text-[#5b665f]">{med.instructions}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={status === "taken" ? "bg-green-100 text-green-800" : status === "missed" ? "bg-red-100 text-red-800" : ""}>{status}</Badge>
                  {status !== "taken" ? (
                    <div className="flex gap-2">
                      <Button variant="primary" onClick={() => markDose(med, "taken")}>Mark taken</Button>
                      <Button variant="ghost" onClick={() => markDose(med, "missed")}>Missed</Button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          }) : <EmptyState title="No medications today" message="Add medications from the Medications page to see them here." />}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Today's appointments" subtitle="Doctor visits, treatments, and scans." />
          <div className="mt-5 grid gap-3">
            {appointments.length ? appointments.map((appt) => (
              <div key={appt.id} className="rounded-2xl border border-[#d8cebd] bg-white p-4">
                <h3 className="text-lg font-black">{appt.title}</h3>
                <p className="font-semibold text-[#5b665f]">{appt.time} · {appt.appointment_type.replace("_", " ")} · {appt.hospital_name || appt.doctor_name}</p>
                <Badge className="mt-2">{appt.status}</Badge>
              </div>
            )) : <EmptyState title="No appointments today" message="A quiet day. Add upcoming visits from the Appointments page." />}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <SectionTitle title="AI risk check" subtitle="Run a supportive safety assessment." />
            <div className="mt-5">
              {assessment ? (
                <div className="rounded-2xl border border-[#d8cebd] bg-white p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="text-lg">{assessment.risk_category.toUpperCase()} · {assessment.risk_score}/100</Badge>
                    <Badge>{assessment.model_version}</Badge>
                  </div>
                  <p className="mt-3 text-lg font-black">{assessment.suggested_action}</p>
                  <p className="mt-2 rounded-2xl bg-[#f7f2e8] p-3 text-sm font-semibold text-[#5b665f]">{assessment.disclaimer}</p>
                </div>
              ) : <EmptyState title="No assessment yet" message="Run a risk check to see your supportive safety score." />}
              <Button className="mt-4" onClick={handleRunAI}><Brain aria-hidden /> Run risk check</Button>
            </div>
          </Card>

          <Card className="border-2 border-[#b65f3a]">
            <SectionTitle title="Need urgent help?" subtitle="Notify your caregiver immediately." />
            <div className="mt-5">
              <Button variant="danger" size="lg" onClick={handleEmergency}><Siren aria-hidden /> Emergency request</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, title, count, href }: { icon: ReactNode; title: string; count: string; href: string }) {
  return (
    <Link to={href} className="senior-card rounded-3xl p-5 transition hover:-translate-y-1">
      <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-[#e6f0ea] text-[#21473e]">{icon}</span>
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-lg font-semibold text-[#5b665f]">{count}</p>
    </Link>
  );
}

export function PatientProfilePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [form, setForm] = useState<Partial<PatientProfile>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    listPatientProfiles()
      .then((profiles) => {
        const ownProfile = profiles[0] ?? null;
        setProfile(ownProfile);
        setForm(ownProfile ?? {});
      })
      .catch((error) => setMessage(apiErrorMessage(error, "Could not load profile.")))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setMessage("");
    try {
      const updated = await updatePatientProfile(profile.id, {
        age: Number(form.age) || null,
        gender: form.gender ?? "",
        address: form.address ?? "",
        emergency_contact_name: form.emergency_contact_name ?? "",
        emergency_contact_phone: form.emergency_contact_phone ?? "",
        cancer_type: form.cancer_type ?? "",
        treatment_stage: form.treatment_stage ?? "",
        primary_hospital: form.primary_hospital ?? "",
        doctor_name: form.doctor_name ?? "",
        notes: form.notes ?? "",
      });
      setProfile(updated);
      setForm(updated);
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not save profile."));
    }
  }

  if (loading) return <LoadingState label="Loading your profile..." />;

  return (
    <div className="grid gap-6">
      <PageHeader title="Patient profile" subtitle="Keep emergency contacts and care context clear for caregivers." />
      <Card>
        {!profile ? <EmptyState title="Profile missing" message="Your profile was not created yet. Try registering again or ask an admin." /> : (
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Label>Age<Input value={form.age ?? ""} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} /></Label>
              <Label>Gender<Input value={form.gender ?? ""} onChange={(e) => setForm({ ...form, gender: e.target.value })} /></Label>
              <Label>Emergency contact name<Input value={form.emergency_contact_name ?? ""} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} /></Label>
              <Label>Emergency contact phone<Input value={form.emergency_contact_phone ?? ""} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} /></Label>
              <Label>Cancer/care type<Input value={form.cancer_type ?? ""} onChange={(e) => setForm({ ...form, cancer_type: e.target.value })} /></Label>
              <Label>Treatment stage<Input value={form.treatment_stage ?? ""} onChange={(e) => setForm({ ...form, treatment_stage: e.target.value })} /></Label>
              <Label>Primary hospital<Input value={form.primary_hospital ?? ""} onChange={(e) => setForm({ ...form, primary_hospital: e.target.value })} /></Label>
              <Label>Doctor name<Input value={form.doctor_name ?? ""} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} /></Label>
            </div>
            <Label>Address<Textarea value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Label>
            <Label>Notes<Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Label>
            {message ? <StatusMessage message={message} tone={message.includes("Could not") ? "error" : "success"} /> : null}
            <Button type="submit">Save profile</Button>
          </form>
        )}
      </Card>
    </div>
  );
}

export function PatientMedicationsPage() {
  const [items, setItems] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ medicine_name: "", dosage: "", frequency_type: "once_daily", scheduled_times: "09:00", start_date: today(), end_date: "", instructions: "" });

  async function load() {
    const [medicationData, logData] = await Promise.all([listMedications(), listMedicationLogs()]);
    setItems(medicationData.results);
    setLogs(logData.results.slice(0, 12));
  }

  useEffect(() => {
    load().catch((error) => setMessage(apiErrorMessage(error, "Could not load medications.")));
  }, []);

  function startEdit(item: Medication) {
    setEditing(item);
    setForm({
      medicine_name: item.medicine_name,
      dosage: item.dosage,
      frequency_type: item.frequency_type,
      scheduled_times: item.scheduled_times.join(", "),
      start_date: item.start_date,
      end_date: item.end_date ?? "",
      instructions: item.instructions,
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const payload = { ...form, end_date: form.end_date || null, scheduled_times: form.scheduled_times.split(",").map((item) => item.trim()).filter(Boolean) };
    try {
      if (editing) {
        await updateMedication(editing.id, payload);
        setMessage("Medication updated.");
      } else {
        await createMedication(payload);
        setMessage("Medication saved.");
      }
      setEditing(null);
      setForm({ medicine_name: "", dosage: "", frequency_type: "once_daily", scheduled_times: "09:00", start_date: today(), end_date: "", instructions: "" });
      await load();
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not save medication."));
    }
  }

  async function mark(medication: Medication, statusValue: string) {
    setMessage("");
    try {
      const scheduled = scheduledDateTimeForToday(medication);
      const existing = logs.find((log) => log.medication === medication.id && sameLocalDate(log.scheduled_datetime, scheduled));
      if (existing) {
        await updateMedicationLog(existing.id, { status: statusValue });
      } else {
        await createMedicationLog({ medication: medication.id, scheduled_datetime: scheduled.toISOString(), status: statusValue });
      }
      setMessage(`Dose marked ${statusValue}.`);
      await load();
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not mark dose."));
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Medications" subtitle="Manage schedules, update medicine details, and keep a clear dose history." />
      {message ? <StatusMessage message={message} tone={message.includes("Could not") ? "error" : "success"} /> : null}
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardTitle>{editing ? "Edit medication" : "Add medication"}</CardTitle>
          <form className="mt-5 grid gap-4" onSubmit={submit}>
            <Label>Medicine name<Input value={form.medicine_name} onChange={(e) => setForm({ ...form, medicine_name: e.target.value })} required /></Label>
            <Label>Dosage<Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} required /></Label>
            <Label>Frequency<Select value={form.frequency_type} onChange={(e) => setForm({ ...form, frequency_type: e.target.value })}><option value="once_daily">Once daily</option><option value="twice_daily">Twice daily</option><option value="custom">Custom</option></Select></Label>
            <Label>Scheduled times<Input value={form.scheduled_times} onChange={(e) => setForm({ ...form, scheduled_times: e.target.value })} placeholder="09:00, 21:00" /></Label>
            <Label>Start date<Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></Label>
            <Label>End date<Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Label>
            <Label>Instructions<Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></Label>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">{editing ? "Update medication" : "Save medication"}</Button>
              {editing ? <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel edit</Button> : null}
            </div>
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
                    <p className="font-semibold text-[#5b665f]">{item.dosage} · {item.frequency_type.replace("_", " ")} · {item.scheduled_times.join(", ") || "No time set"}</p>
                    {item.instructions ? <p className="mt-1 font-semibold text-[#5b665f]">{item.instructions}</p> : null}
                  </div>
                  <Badge>{item.is_active ? "Active" : "Disabled"}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["taken", "missed", "skipped", "delayed"].map((statusValue) => (
                    <Button key={statusValue} type="button" variant={statusValue === "missed" ? "danger" : "secondary"} onClick={() => mark(item, statusValue)}>
                      Mark {statusValue}
                    </Button>
                  ))}
                  <Button type="button" variant="ghost" onClick={() => startEdit(item)}>Edit</Button>
                  <Button type="button" variant="ghost" onClick={() => updateMedication(item.id, { is_active: !item.is_active }).then(load)}>
                    {item.is_active ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            )) : <EmptyState title="No medications yet" message="Add the first schedule to begin tracking treatment routines." />}
          </div>
        </Card>
      </div>
      <Card>
        <CardTitle>Recent dose history</CardTitle>
        <div className="mt-5 grid gap-3">
          {logs.length ? logs.map((log) => (
            <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d8cebd] bg-white p-4">
              <div>
                <p className="text-lg font-black">{log.medication_name}</p>
                <p className="font-semibold text-[#5b665f]">{formatDateTime(log.scheduled_datetime)}</p>
              </div>
              <Badge>{log.status}</Badge>
            </div>
          )) : <EmptyState title="No dose logs yet" message="Marked doses will appear here." />}
        </div>
      </Card>
    </div>
  );
}

export function PatientAppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", appointment_type: "consultation", hospital_name: "", doctor_name: "", date: today(), time: "10:00", notes: "" });

  async function load() {
    setItems(await listAppointments());
  }

  useEffect(() => {
    load().catch((error) => setMessage(apiErrorMessage(error, "Could not load appointments.")));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await createAppointment(form);
      setForm({ ...form, title: "", notes: "" });
      setMessage("Appointment saved.");
      await load();
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not save appointment."));
    }
  }

  async function setStatus(item: Appointment, statusValue: string) {
    setMessage("");
    try {
      await updateAppointment(item.id, { status: statusValue });
      setMessage(`Appointment marked ${statusValue}.`);
      await load();
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not update appointment."));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardTitle>Add appointment</CardTitle>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <Label>Title<Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Label>
          <Label>Type<Select value={form.appointment_type} onChange={(e) => setForm({ ...form, appointment_type: e.target.value })}><option value="consultation">Consultation</option><option value="treatment">Treatment</option><option value="scan">Scan</option><option value="lab_test">Lab test</option><option value="follow_up">Follow up</option><option value="other">Other</option></Select></Label>
          <Label>Hospital<Input value={form.hospital_name} onChange={(e) => setForm({ ...form, hospital_name: e.target.value })} /></Label>
          <Label>Doctor<Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} /></Label>
          <Label>Date<Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></Label>
          <Label>Time<Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></Label>
          <Label>Notes<Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Label>
          {message ? <StatusMessage message={message} tone={message.includes("Could not") ? "error" : "success"} /> : null}
          <Button type="submit">Save appointment</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Appointments</CardTitle>
        <div className="mt-5 grid gap-3">
          {items.length ? items.map((item) => (
            <div key={item.id} className="rounded-3xl border border-[#d8cebd] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">{item.title}</h3>
                  <p className="font-semibold text-[#5b665f]">{item.date} at {item.time} · {item.appointment_type.replace("_", " ")}</p>
                  {item.hospital_name || item.doctor_name ? <p className="font-semibold text-[#5b665f]">{[item.hospital_name, item.doctor_name].filter(Boolean).join(" · ")}</p> : null}
                </div>
                <Badge>{item.status}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["completed", "missed", "cancelled"].map((statusValue) => (
                  <Button key={statusValue} type="button" variant={statusValue === "missed" ? "danger" : "secondary"} onClick={() => setStatus(item, statusValue)}>
                    Mark {statusValue}
                  </Button>
                ))}
              </div>
            </div>
          )) : <EmptyState title="No appointments yet" message="Add upcoming visits so the care timeline is visible." />}
        </div>
      </Card>
    </div>
  );
}

export function PatientHealthPage() {
  const [assessment, setAssessment] = useState<AIRiskAssessment | null>(null);
  const [assessments, setAssessments] = useState<AIRiskAssessment[]>([]);
  const [vitalHistory, setVitalHistory] = useState<VitalSign[]>([]);
  const [symptomHistory, setSymptomHistory] = useState<SymptomRecord[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [message, setMessage] = useState("");
  const [vitals, setVitals] = useState({ temperature: "37.0", heart_rate: "82", oxygen_level: "98", systolic_bp: "120", diastolic_bp: "80", pain_level: "2", fatigue_level: "2", appetite_level: "6", notes: "" });
  const [symptoms, setSymptoms] = useState({ fever: false, nausea: false, vomiting: false, severe_pain: false, breathing_difficulty: false, dizziness: false, bleeding: false, fatigue: false, appetite_loss: false, infection_signs: false, symptom_severity_score: "0", notes: "" });

  async function load() {
    const [vitalData, symptomData, assessmentData, emergencyData] = await Promise.all([listVitals(), listSymptoms(), listAssessments(), listEmergencies()]);
    setVitalHistory(vitalData.slice(0, 5));
    setSymptomHistory(symptomData.slice(0, 5));
    setAssessments(assessmentData.slice(0, 5));
    setAssessment(assessmentData[0] ?? null);
    setEmergencies(emergencyData.slice(0, 5));
  }

  useEffect(() => {
    load().catch((error) => setMessage(apiErrorMessage(error, "Could not load health history.")));
  }, []);

  async function saveVitals(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await createVitals({ ...numberPayload(vitals), recorded_at: new Date().toISOString() });
      setMessage("Vitals saved. Alerts are created automatically if values cross demo thresholds.");
      await load();
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not save vitals."));
    }
  }

  async function saveSymptoms(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await createSymptoms({ ...symptoms, symptom_severity_score: Number(symptoms.symptom_severity_score), symptom_date: today() });
      setMessage("Symptoms saved.");
      await load();
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not save symptoms."));
    }
  }

  async function runRiskCheck() {
    setMessage("");
    try {
      const data = await runAssessment();
      setAssessment(data);
      setMessage("AI-assisted risk check completed.");
      await load();
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not run risk check."));
    }
  }

  async function triggerEmergency() {
    setMessage("");
    try {
      await createEmergency({ emergency_type: "urgent_help", message: "Patient requested urgent caregiver support." });
      setMessage("Emergency request created. Linked caregivers can see and acknowledge it.");
      await load();
    } catch (error) {
      setMessage(apiErrorMessage(error, "Could not create emergency request."));
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Health monitoring and AI risk check"
        subtitle="Supportive risk assessment only. It is not a diagnosis and does not replace a doctor."
        action={<Button variant="danger" onClick={triggerEmergency}><Siren aria-hidden /> Emergency request</Button>}
      />
      {message ? <StatusMessage message={message} tone={message.includes("Could not") ? "error" : "success"} /> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Add vitals</CardTitle>
          <form className="mt-5 grid gap-4" onSubmit={saveVitals}>
            {(["temperature", "heart_rate", "oxygen_level", "systolic_bp", "diastolic_bp", "pain_level", "fatigue_level", "appetite_level"] as const).map((key) => (
              <Label key={key}>{key.replaceAll("_", " ")}<Input type="number" step={key === "temperature" ? "0.1" : "1"} value={vitals[key]} onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })} /></Label>
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
            <Label>Severity score 0-10<Input type="number" min="0" max="10" value={symptoms.symptom_severity_score} onChange={(e) => setSymptoms({ ...symptoms, symptom_severity_score: e.target.value })} /></Label>
            <Label>Notes<Textarea value={symptoms.notes} onChange={(e) => setSymptoms({ ...symptoms, notes: e.target.value })} /></Label>
            <Button type="submit">Save symptoms</Button>
          </form>
        </Card>
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle title="AI-assisted risk assessment" subtitle="Uses latest vitals, symptoms, adherence, appointments, and emergency history." />
          <Button onClick={runRiskCheck}><Brain aria-hidden /> Run risk check</Button>
        </div>
        {assessment ? <AssessmentCard assessment={assessment} /> : <div className="mt-4"><EmptyState title="No assessment yet" message="Save vitals and symptoms, then run a risk check." /></div>}
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <HistoryCard title="Recent vitals" items={vitalHistory} render={(item) => `${formatDateTime(item.recorded_at)} · O2 ${item.oxygen_level ?? "n/a"} · Temp ${item.temperature ?? "n/a"} · Pain ${item.pain_level}`} />
        <HistoryCard title="Recent symptoms" items={symptomHistory} render={(item) => `${item.symptom_date} · severity ${item.symptom_severity_score} · ${activeSymptoms(item).join(", ") || "No major symptoms"}`} />
        <HistoryCard title="Assessment history" items={assessments} render={(item) => `${formatDateTime(item.created_at)} · ${item.risk_category} · ${item.risk_score}/100`} />
        <HistoryCard title="Emergency requests" items={emergencies} render={(item) => `${formatDateTime(item.created_at)} · ${item.status} · ${item.message || "Urgent help requested"}`} />
      </div>
    </div>
  );
}

function QuickCard({ icon, title, text, href }: { icon: ReactNode; title: string; text: string; href: string }) {
  return (
    <Link to={href} className="senior-card rounded-3xl p-5 transition hover:-translate-y-1">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-[#e6f0ea] text-[#21473e]">{icon}</span>
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="mt-2 text-lg font-semibold text-[#5b665f]">{text}</p>
    </Link>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#d8cebd] bg-white p-4">
      <AlertTriangle className="mt-1 text-[#b65f3a]" aria-hidden />
      <div>
        <h3 className="text-lg font-black">{alert.title}</h3>
        <p className="font-semibold text-[#5b665f]">{alert.message}</p>
        <Badge className="mt-2">{alert.severity} · {alert.status}</Badge>
      </div>
    </div>
  );
}

function AssessmentCard({ assessment }: { assessment: AIRiskAssessment }) {
  return (
    <div className="mt-5 rounded-3xl border border-[#d8cebd] bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="text-lg">{assessment.risk_category.toUpperCase()} · {assessment.risk_score}/100</Badge>
        <Badge>Confidence {assessment.confidence ?? "n/a"}</Badge>
        <Badge>{assessment.model_version}</Badge>
      </div>

      {assessment.freshness_warnings?.length ? (
        <div className="mt-4 rounded-2xl border-2 border-[#f2c66d] bg-[#fef9ed] p-4">
          <p className="mb-2 font-black text-[#b65f3a]">Data freshness warning</p>
          <ul className="grid gap-1 text-sm font-semibold text-[#5b665f]">
            {assessment.freshness_warnings.map((w) => <li key={w}>· {w}</li>)}
          </ul>
        </div>
      ) : null}

      {assessment.risk_trend?.direction !== "first" ? (
        <div className={`mt-4 rounded-2xl p-4 ${assessment.risk_trend?.direction === "worsening" ? "border-2 border-red-200 bg-red-50" : assessment.risk_trend?.direction === "improving" ? "border-2 border-green-200 bg-green-50" : "bg-[#f7f2e8]"}`}>
          <p className="font-black">{assessment.risk_trend?.message}</p>
        </div>
      ) : null}

      {assessment.confidence_explanation?.length ? (
        <div className="mt-4 rounded-2xl bg-[#e6f0ea] p-4">
          <p className="mb-2 font-black text-[#21473e]">Confidence explanation</p>
          <ul className="grid gap-1 text-sm font-semibold text-[#5b665f]">
            {assessment.confidence_explanation.map((e) => <li key={e}>· {e}</li>)}
          </ul>
        </div>
      ) : null}

      <ul className="mt-4 grid gap-2 text-lg font-semibold">
        {assessment.reasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
      <p className="mt-4 text-lg font-black">{assessment.suggested_action}</p>
      <p className="mt-3 rounded-2xl bg-[#f7f2e8] p-3 text-sm font-semibold text-[#5b665f]">{assessment.disclaimer}</p>
      <details className="mt-4 rounded-2xl bg-[#f7f2e8] p-3">
        <summary className="cursor-pointer font-black">Data used</summary>
        <div className="mt-3 grid gap-2 text-sm font-semibold text-[#5b665f] sm:grid-cols-2">
          {Object.entries(assessment.input_snapshot).slice(0, 12).map(([key, value]) => <span key={key}>{key.replaceAll("_", " ")}: {String(value ?? "n/a")}</span>)}
        </div>
      </details>
    </div>
  );
}

function HistoryCard<T extends { id: number }>({ title, items, render }: { title: string; items: T[]; render: (item: T) => string }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-5 grid gap-3">
        {items.length ? items.map((item) => <div key={item.id} className="rounded-2xl border border-[#d8cebd] bg-white p-4 text-lg font-semibold text-[#5b665f]">{render(item)}</div>) : <EmptyState title="Nothing recorded yet" message="New entries will appear here." />}
      </div>
    </Card>
  );
}

function numberPayload(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, key === "notes" ? value : Number(value)]));
}

function scheduledDateTimeForToday(medication: Medication) {
  const date = new Date();
  const [hour = "9", minute = "0"] = (medication.scheduled_times[0] ?? "09:00").split(":");
  date.setHours(Number(hour), Number(minute), 0, 0);
  return date;
}

function sameLocalDate(dateValue: string, target: Date) {
  const date = new Date(dateValue);
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth() && date.getDate() === target.getDate();
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function activeSymptoms(item: SymptomRecord) {
  return (["fever", "nausea", "vomiting", "severe_pain", "breathing_difficulty", "dizziness", "bleeding", "fatigue", "appetite_loss", "infection_signs"] as const)
    .filter((key) => item[key])
    .map((key) => key.replaceAll("_", " "));
}
