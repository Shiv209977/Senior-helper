'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { Users, AlertTriangle, Brain, CheckCircle, KeyRound, X } from 'lucide-react';
import { listCaregiverLinks, acceptInvite } from '@/lib/api/caregiver-links';
import { listAlerts, acknowledgeAlert, resolveAlert } from '@/lib/api/alerts';
import { listEmergencies, acknowledgeEmergency, resolveEmergency } from '@/lib/api/emergencies';
import { runAssessment } from '@/lib/api/ai';
import type { CaregiverLink, Alert, EmergencyRequest, AIRiskAssessment } from '@/lib/api/types';

const TEAL = '#1B7A6E';
const LAVENDER = '#7B68AE';

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

  const severityColors: Record<string, { bg: string; text: string }> = {
    low: { bg: '#F0FDF4', text: '#166534' },
    medium: { bg: '#FEF9C3', text: '#854D0E' },
    high: { bg: '#FEF2F2', text: '#991B1B' },
    emergency: { bg: '#FEE2E2', text: '#DC2626' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full"
          style={{
            borderColor: TEAL,
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite',
          }}
        />
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Caregiver Dashboard</h1>
        <p className="text-lg text-gray-500">Monitor and support your linked patients</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[15px]">
          {error}
        </div>
      )}

      {/* Accept invite */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
          <KeyRound className="w-5 h-5" style={{ color: TEAL }} /> Accept Invite Code
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter invite code from patient"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
          />
          <button
            onClick={handleAcceptInvite}
            disabled={accepting || !inviteCode.trim()}
            className="px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 disabled:opacity-50 transition"
            style={{ backgroundColor: TEAL }}
          >
            {accepting ? 'Accepting…' : 'Accept'}
          </button>
        </div>
      </div>

      {/* Active emergencies */}
      {activeEmergencies.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Active Emergencies
          </h2>
          <div className="space-y-3">
            {activeEmergencies.map((e) => (
              <div key={e.id} className="bg-red-50 rounded-2xl border border-red-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-red-700 text-[17px]">🚨 {e.patient_name}</p>
                  <span className="px-3 py-1 rounded-full text-[12px] font-bold capitalize bg-red-100 text-red-700">
                    {e.status}
                  </span>
                </div>
                {e.message && <p className="text-red-600 mb-3">{e.message}</p>}
                <div className="flex gap-2">
                  {e.status === 'active' && (
                    <button
                      onClick={() =>
                        setNoteModal({ type: 'emergency', id: e.id, action: 'acknowledge' })
                      }
                      className="px-4 py-2 rounded-xl bg-yellow-500 text-white font-semibold text-[14px] hover:bg-yellow-600 transition"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => setNoteModal({ type: 'emergency', id: e.id, action: 'resolve' })}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold text-[14px] hover:bg-green-700 transition"
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
      <h2 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
        <Users className="w-5 h-5" style={{ color: TEAL }} /> Linked Patients
      </h2>
      {links.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400 text-lg">
            No patients linked yet. Accept an invite code above.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {links.map((l) => (
            <div
              key={l.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: TEAL }}
              >
                {l.patient_name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-[17px]">{l.patient_name}</p>
                <p className="text-sm text-gray-400">Linked Patient</p>
              </div>
              <button
                onClick={() => handleRunAI(l.patient)}
                disabled={aiRunning}
                className="p-2 rounded-lg hover:bg-purple-50 transition"
                title="Run AI Check"
              >
                <Brain className="w-5 h-5" style={{ color: LAVENDER }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AI Result */}
      {aiResult && (
        <div className="mb-6 bg-white rounded-2xl border-2 p-6" style={{ borderColor: LAVENDER }}>
          <h3 className="font-bold text-gray-900 text-lg mb-2">
            AI Assessment: {aiResult.patient_name}
          </h3>
          <div className="flex items-center gap-4 mb-3">
            <span
              className="text-3xl font-bold"
              style={{ color: severityColors[aiResult.risk_category]?.text }}
            >
              {aiResult.risk_score}
            </span>
            <span
              className="px-3 py-1 rounded-full text-[14px] font-bold uppercase"
              style={{
                backgroundColor: severityColors[aiResult.risk_category]?.bg,
                color: severityColors[aiResult.risk_category]?.text,
              }}
            >
              {aiResult.risk_category}
            </span>
          </div>
          <ul className="space-y-1 mb-3">
            {aiResult.reasons.map((r, i) => (
              <li key={i} className="text-[15px] text-gray-600">
                • {r}
              </li>
            ))}
          </ul>
          <p className="text-[14px] p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800">
            {aiResult.disclaimer}
          </p>
        </div>
      )}

      {/* Alerts */}
      <h2 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" style={{ color: '#D4686A' }} /> Patient Alerts
      </h2>
      {openAlerts.length === 0 ? (
        <p className="text-gray-400 py-4">No open alerts</p>
      ) : (
        <div className="space-y-3 mb-6">
          {openAlerts.map((a) => {
            const sc = severityColors[a.severity] ?? severityColors.low;
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: sc.text }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-[16px]" style={{ color: sc.text }}>
                        {a.title}
                      </p>
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase"
                        style={{ backgroundColor: sc.bg, color: sc.text }}
                      >
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{a.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {a.patient_name} · {a.alert_type}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 justify-end">
                  {a.status === 'open' && (
                    <button
                      onClick={() =>
                        setNoteModal({ type: 'alert', id: a.id, action: 'acknowledge' })
                      }
                      className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => setNoteModal({ type: 'alert', id: a.id, action: 'resolve' })}
                    className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" /> Resolve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action note modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
            <button
              onClick={() => {
                setNoteModal(null);
                setActionNote('');
              }}
              className="absolute top-4 right-4 p-1 text-gray-400"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize">
              {noteModal.action} {noteModal.type}
            </h2>
            <textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2 resize-none mb-4"
              placeholder="Optional note…"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setNoteModal(null);
                  setActionNote('');
                }}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl text-white font-semibold hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: noteModal.action === 'resolve' ? '#16A34A' : '#EAB308' }}
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
