'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import {
  Pill,
  CalendarCheck,
  Activity,
  Brain,
  AlertTriangle,
  Bell,
  CheckCircle,
  XCircle,
  SkipForward,
  ChevronRight,
  Clock,
  HeartPulse,
} from 'lucide-react';
import { listMedicationLogs, updateMedicationLog } from '@/lib/api/medications';
import { listAppointments } from '@/lib/api/appointments';
import { listAlerts } from '@/lib/api/alerts';
import type { MedicationLog, Appointment, Alert } from '@/lib/api/types';
import { toast } from 'sonner';
import { formatDate, formatTime } from '@/lib/format';

const QUICK_ACTIONS = [
  { label: 'Log Vitals', href: '/patient/vitals', icon: Activity, fg: 'text-teal', tile: 'bg-teal-soft' },
  { label: 'Log Symptoms', href: '/patient/vitals', icon: HeartPulse, fg: 'text-lavender-deep', tile: 'bg-lavender-soft' },
  { label: 'AI Check', href: '/patient/ai', icon: Brain, fg: 'text-gold', tile: 'bg-gold/15' },
  { label: 'Emergency', href: '/patient/emergencies', icon: AlertTriangle, fg: 'text-coral', tile: 'bg-coral-soft' },
];

const STATUS_PILL: Record<string, string> = {
  taken: 'bg-teal-soft text-teal-deep',
  missed: 'bg-coral-soft text-coral',
  skipped: 'bg-muted text-muted-foreground',
};

const SEVERITY: Record<string, { wrap: string; text: string; chip: string }> = {
  low: { wrap: 'bg-teal-soft/70 border-teal/15', text: 'text-teal-deep', chip: 'bg-teal/15 text-teal-deep' },
  medium: { wrap: 'bg-gold/10 border-gold/25', text: 'text-ink', chip: 'bg-gold/20 text-ink' },
  high: { wrap: 'bg-coral-soft border-coral/20', text: 'text-coral', chip: 'bg-coral/15 text-coral' },
  emergency: { wrap: 'bg-coral-soft border-coral/40', text: 'text-coral', chip: 'bg-coral text-white' },
};

function TodayContent() {
  const [medLogs, setMedLogs] = useState<MedicationLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  const fetchData = useCallback(async () => {
    if (!today) return;
    setLoading(true);
    try {
      const [logRes, aptRes, alertRes] = await Promise.all([
        listMedicationLogs(1),
        listAppointments(1),
        listAlerts(1),
      ]);
      // Filter today's med logs
      const todayLogs = logRes.results.filter((l) => l.scheduled_datetime.startsWith(today));
      setMedLogs(todayLogs);
      // Filter upcoming appointments
      const upcoming = aptRes.results.filter((a) => a.status === 'upcoming' && a.date >= today);
      setAppointments(upcoming.slice(0, 5));
      // Recent open alerts
      const openAlerts = alertRes.results.filter((a) => a.status === 'open');
      setAlerts(openAlerts.slice(0, 5));
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markLog = async (logId: number, status: 'taken' | 'missed' | 'skipped') => {
    try {
      await updateMedicationLog(logId, { status });
      setMedLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, status } : l)));
      toast.success(status === 'taken' ? 'Marked as taken' : status === 'missed' ? 'Marked as missed' : 'Dose skipped');
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="h-11 w-11 rounded-full border-4 border-teal-soft border-t-teal"
          style={{ animation: 'spin 0.9s linear infinite' }}
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
      <div className="animate-rise mb-8">
        <h1 className="mb-1.5 text-4xl">Good day! 👋</h1>
        <p className="text-xl text-muted-foreground">Here&apos;s your care summary for today.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
          {error}
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {QUICK_ACTIONS.map((a, i) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              href={a.href}
              className="animate-rise group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <span className={`grid h-14 w-14 place-items-center rounded-2xl ${a.tile}`}>
                <Icon className={`h-7 w-7 ${a.fg}`} />
              </span>
              <span className="text-[15px] font-semibold text-ink">{a.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Medications */}
        <div className="animate-rise rounded-2xl border border-border bg-card p-6 shadow-soft" style={{ animationDelay: '0.1s' }}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-2xl">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-coral-soft">
                <Pill className="h-5 w-5 text-coral" />
              </span>
              Today&apos;s Medications
            </h2>
            <Link
              href="/patient/medications"
              className="flex items-center gap-1 text-[14px] font-semibold text-teal transition-colors hover:text-teal-deep"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {medLogs.length === 0 ? (
            <p className="py-4 text-[16px] text-muted-foreground">No medications scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {medLogs.map((log) => {
                // Extract time from ISO string without new Date() to avoid hydration issues
                const timePart = log.scheduled_datetime.includes('T')
                  ? (log.scheduled_datetime.split('T')[1]?.substring(0, 5) ?? '')
                  : '';
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-background/60 p-4"
                  >
                    <div className="flex-1">
                      <p className="text-[16px] font-semibold text-ink">{log.medication_name}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" /> {timePart}
                      </p>
                    </div>
                    {log.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => markLog(log.id, 'taken')}
                          className="rounded-xl bg-teal-soft p-2.5 text-teal-deep transition-colors hover:bg-teal hover:text-white"
                          title="Taken"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => markLog(log.id, 'missed')}
                          className="rounded-xl bg-coral-soft p-2.5 text-coral transition-colors hover:bg-coral hover:text-white"
                          title="Missed"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => markLog(log.id, 'skipped')}
                          className="rounded-xl bg-muted p-2.5 text-muted-foreground transition-colors hover:bg-muted-foreground/20"
                          title="Skip"
                        >
                          <SkipForward className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`rounded-full px-3 py-1 text-[13px] font-semibold capitalize ${STATUS_PILL[log.status] ?? STATUS_PILL.skipped}`}
                      >
                        {log.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="animate-rise rounded-2xl border border-border bg-card p-6 shadow-soft" style={{ animationDelay: '0.16s' }}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-2xl">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-lavender-soft">
                <CalendarCheck className="h-5 w-5 text-lavender" />
              </span>
              Upcoming Appointments
            </h2>
            <Link
              href="/patient/appointments"
              className="flex items-center gap-1 text-[14px] font-semibold text-teal transition-colors hover:text-teal-deep"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {appointments.length === 0 ? (
            <p className="py-4 text-[16px] text-muted-foreground">No upcoming appointments.</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt.id} className="rounded-2xl border border-border bg-background/60 p-4">
                  <p className="text-[16px] font-semibold text-ink">{apt.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarCheck className="h-3.5 w-3.5" /> {formatDate(apt.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {formatTime(apt.time)}
                    </span>
                  </div>
                  {apt.doctor_name && (
                    <p className="mt-1 text-sm text-muted-foreground">Dr. {apt.doctor_name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="animate-rise rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2" style={{ animationDelay: '0.22s' }} aria-live="polite">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-2xl">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-coral-soft">
                <Bell className="h-5 w-5 text-coral" />
              </span>
              Recent Alerts
            </h2>
          </div>
          {alerts.length === 0 ? (
            <p className="py-4 text-[16px] text-muted-foreground">No open alerts — that&apos;s great!</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const sc = SEVERITY[alert.severity] ?? SEVERITY.low;
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 rounded-2xl border p-4 ${sc.wrap}`}
                  >
                    <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${sc.text}`} />
                    <div className="flex-1">
                      <p className={`text-[16px] font-semibold ${sc.text}`}>{alert.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold uppercase tracking-wide ${sc.chip}`}>
                      {alert.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PatientTodayPage() {
  return (
    <AuthGuard allowedRoles={['patient']}>
      <AppLayout>
        <TodayContent />
      </AppLayout>
    </AuthGuard>
  );
}
