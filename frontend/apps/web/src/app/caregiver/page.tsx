'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { Users, AlertTriangle, Brain, CheckCircle, KeyRound, X, LayoutDashboard } from 'lucide-react';
import { listCaregiverLinks, acceptInvite } from '@/lib/api/caregiver-links';
import { listAlerts, acknowledgeAlert, resolveAlert } from '@/lib/api/alerts';
import { listEmergencies, acknowledgeEmergency, resolveEmergency } from '@/lib/api/emergencies';
import { runAssessment } from '@/lib/api/ai';
import type { CaregiverLink, Alert, EmergencyRequest, AIRiskAssessment } from '@/lib/api/types';
import { toast } from 'sonner';
import { PageHeader, Spinner, useDialogA11y } from '@/components/ui-kit';

const SEVERITY: Record<string, { chip: string; text: string }> = {
  low: { chip: 'bg-teal-soft text-teal-deep', text: 'text-teal-deep' },
  medium: { chip: 'bg-gold/20 text-ink', text: 'text-ink' },
  high: { chip: 'bg-coral-soft text-coral', text: 'text-coral' },
  emergency: { chip: 'bg-coral text-white', text: 'text-coral' },
};

function CaregiverContent() {
  const [links, setLinks] = useState<CaregiverLink[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [aiResult, setAiResult] = useState<AIRiskAssessment | null>(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [noteModal, setNoteModal] = useState<{
    type: 'alert' | 'emergency';
    id: number;
    action: 'acknowledge' | 'resolve';
  } | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [linkData, alertData, emerData] = await Promise.all([
        listCaregiverLinks(),
        listAlerts(1),
        listEmergencies(1),
      ]);
      setLinks(linkData.filter((l) => l.status === 'active'));
      setAlerts(alertData.results);
      setEmergencies(emerData.results);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAcceptInvite = async () => {
    if (!inviteCode.trim()) return;
    setError('');
    setAccepting(true);
    try {
      await acceptInvite(inviteCode.trim());
      setInviteCode('');
      toast.success('Patient linked');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  const handleAction = async () => {
    if (!noteModal) return;
    setActionLoading(true);
    try {
      if (noteModal.type === 'alert') {
        if (noteModal.action === 'acknowledge') await acknowledgeAlert(noteModal.id, actionNote);
        else await resolveAlert(noteModal.id, actionNote);
      } else {
        if (noteModal.action === 'acknowledge') await acknowledgeEmergency(noteModal.id);
        else await resolveEmergency(noteModal.id);
      }
      toast.success(noteModal.action === 'resolve' ? 'Marked resolved' : 'Acknowledged');
      setNoteModal(null);
      setActionNote('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunAI = async (patientId: number) => {
    setAiRunning(true);
    setAiResult(null);
    try {
      const result = await runAssessment(patientId);
      setAiResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAiRunning(false);
    }
  };

  const activeEmergencies = emergencies.filter(
    (e) => e.status === 'active' || e.status === 'acknowledged'
  );
  const openAlerts = alerts.filter((a) => a.status === 'open' || a.status === 'acknowledged');

  const dialogRef = useDialogA11y<HTMLDivElement>(() => {
    setNoteModal(null);
    setActionNote('');
  });

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <PageHeader
        icon={<LayoutDashboard className="h-6 w-6" />}
        title="Caregiver Dashboard"
        subtitle="Monitor and support your linked patients"
        accent="teal"
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
          {error}
        </div>
      )}

      {/* Accept invite */}
      <div className="animate-rise mb-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-xl text-ink">
          <KeyRound className="h-5 w-5 text-teal" /> Accept Invite Code
        </h2>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter invite code from patient"
            className="min-w-0 flex-1 rounded-xl border border-transparent bg-muted/50 px-4 py-3 text-[16px] text-ink transition-colors focus:border-ring focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/55"
          />
          <button
            onClick={handleAcceptInvite}
            disabled={accepting || !inviteCode.trim()}
            className="rounded-full bg-teal px-6 py-3 font-semibold text-white shadow-soft transition-all hover:bg-teal-deep hover:shadow-lift disabled:opacity-50"
          >
            {accepting ? 'Accepting…' : 'Accept'}
          </button>
        </div>
      </div>

      {/* Active emergencies */}
      {activeEmergencies.length > 0 && (
        <div className="mb-6" role="status" aria-live="assertive">
          <h2 className="mb-3 flex items-center gap-2 font-serif text-xl text-ink">
            <AlertTriangle className="h-5 w-5 text-coral" /> Active Emergencies
          </h2>
          <div className="space-y-3">
            {activeEmergencies.map((e) => (
              <div key={e.id} className="rounded-2xl border border-coral/30 bg-coral-soft p-5 shadow-soft">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[17px] font-bold text-coral">🚨 {e.patient_name}</p>
                  <span className="rounded-full bg-coral px-3 py-1 text-[12px] font-bold capitalize text-white">
                    {e.status}
                  </span>
                </div>
                {e.message && <p className="mb-3 text-ink">{e.message}</p>}
                <div className="flex gap-2">
                  {e.status === 'active' && (
                    <button
                      onClick={() =>
                        setNoteModal({ type: 'emergency', id: e.id, action: 'acknowledge' })
                      }
                      className="rounded-full bg-gold px-4 py-2 text-[14px] font-semibold text-ink transition hover:brightness-95"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => setNoteModal({ type: 'emergency', id: e.id, action: 'resolve' })}
                    className="rounded-full bg-teal px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-teal-deep"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked patients */}
      <h2 className="mb-3 flex items-center gap-2 font-serif text-xl text-ink">
        <Users className="h-5 w-5 text-teal" /> Linked Patients
      </h2>
      {links.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-teal-soft">
            <Users className="h-6 w-6 text-teal" />
          </span>
          <p className="text-lg text-muted-foreground">
            No patients linked yet. Accept an invite code above.
          </p>
        </div>
      ) : (
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {links.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="grid h-12 w-12 place-items-center rounded-full bg-teal font-bold text-white">
                {l.patient_name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-[17px] font-bold text-ink">{l.patient_name}</p>
                <p className="text-sm text-muted-foreground">Linked Patient</p>
              </div>
              <button
                onClick={() => handleRunAI(l.patient)}
                disabled={aiRunning}
                className="rounded-xl p-2.5 text-lavender transition-colors hover:bg-lavender-soft disabled:opacity-50"
                title="Run AI Check"
              >
                <Brain className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AI Result */}
      {aiResult && (
        <div className="animate-rise mb-6 rounded-[1.5rem] border-2 border-lavender/40 bg-card p-6 shadow-soft">
          <h3 className="mb-2 font-serif text-xl text-ink">AI Assessment: {aiResult.patient_name}</h3>
          <div className="mb-3 flex items-center gap-4">
            <span className={`font-serif text-3xl font-semibold ${SEVERITY[aiResult.risk_category]?.text}`}>
              {aiResult.risk_score}
            </span>
            <span className={`rounded-full px-3 py-1 text-[14px] font-bold uppercase tracking-wide ${SEVERITY[aiResult.risk_category]?.chip}`}>
              {aiResult.risk_category}
            </span>
          </div>
          <ul className="mb-3 space-y-1">
            {aiResult.reasons.map((r, i) => (
              <li key={i} className="text-[15px] text-muted-foreground">
                • {r}
              </li>
            ))}
          </ul>
          {/* Disclaimer — ALWAYS shown */}
          <p className="rounded-2xl border border-gold/30 bg-gold/10 p-3 text-[14px] text-ink">
            {aiResult.disclaimer}
          </p>
        </div>
      )}

      {/* Alerts */}
      <h2 className="mb-3 flex items-center gap-2 font-serif text-xl text-ink">
        <AlertTriangle className="h-5 w-5 text-coral" /> Patient Alerts
      </h2>
      {openAlerts.length === 0 ? (
        <p className="py-4 text-muted-foreground">No open alerts</p>
      ) : (
        <div className="mb-6 space-y-3">
          {openAlerts.map((a) => {
            const sc = SEVERITY[a.severity] ?? SEVERITY.low;
            return (
              <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`mt-0.5 h-5 w-5 ${sc.text}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-[16px] font-semibold ${sc.text}`}>{a.title}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${sc.chip}`}>
                        {a.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.patient_name} · {a.alert_type}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  {a.status === 'open' && (
                    <button
                      onClick={() =>
                        setNoteModal({ type: 'alert', id: a.id, action: 'acknowledge' })
                      }
                      className="rounded-full bg-gold/20 px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-gold/30"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => setNoteModal({ type: 'alert', id: a.id, action: 'resolve' })}
                    className="flex items-center gap-1 rounded-full bg-teal-soft px-4 py-2 text-[13px] font-semibold text-teal-deep transition-colors hover:bg-teal hover:text-white"
                  >
                    <CheckCircle className="h-4 w-4" /> Resolve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action note modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="shadow-lift relative w-full max-w-md rounded-[1.75rem] bg-card p-8"
          >
            <button
              onClick={() => {
                setNoteModal(null);
                setActionNote('');
              }}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="mb-4 text-2xl capitalize">
              {noteModal.action} {noteModal.type}
            </h2>
            <textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              rows={3}
              className="mb-4 w-full resize-none rounded-xl border border-transparent bg-muted/50 px-4 py-3 text-[16px] text-ink transition-colors focus:border-ring focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/55"
              placeholder="Optional note…"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setNoteModal(null);
                  setActionNote('');
                }}
                className="flex-1 rounded-full border-2 border-border py-3 font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`flex-1 rounded-full py-3 font-semibold transition-all disabled:opacity-50 ${
                  noteModal.action === 'resolve'
                    ? 'bg-teal text-white hover:bg-teal-deep'
                    : 'bg-gold text-ink hover:brightness-95'
                }`}
              >
                {actionLoading ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function CaregiverDashboard() {
  return (
    <AuthGuard allowedRoles={['caregiver']}>
      <AppLayout>
        <CaregiverContent />
      </AppLayout>
    </AuthGuard>
  );
}
