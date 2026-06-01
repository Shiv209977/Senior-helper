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
} from 'lucide-react';
import { listMedicationLogs, updateMedicationLog } from '@/lib/api/medications';
import { listAppointments } from '@/lib/api/appointments';
import { listAlerts } from '@/lib/api/alerts';
import type { MedicationLog, Appointment, Alert } from '@/lib/api/types';

const TEAL = '#1B7A6E';
const CORAL = '#D4686A';
const LAVENDER = '#7B68AE';

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
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
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
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Good day! 👋</h1>
        <p className="text-lg text-gray-500">Here&apos;s your care summary for today.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[15px]">
          {error}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Log Vitals',
            href: '/patient/vitals',
            icon: Activity,
            color: TEAL,
            bg: '#E8F5F2',
          },
          {
            label: 'Log Symptoms',
            href: '/patient/vitals',
            icon: AlertTriangle,
            color: CORAL,
            bg: '#FEF2F2',
          },
          { label: 'AI Check', href: '/patient/ai', icon: Brain, color: LAVENDER, bg: '#F3EFF8' },
          {
            label: 'Emergency',
            href: '/patient/emergencies',
            icon: AlertTriangle,
            color: '#DC2626',
            bg: '#FEF2F2',
          },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-gray-100 hover:shadow-md transition text-center"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: a.bg }}
              >
                <Icon className="w-6 h-6" style={{ color: a.color }} />
              </div>
              <span className="text-[15px] font-semibold text-gray-700">{a.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Medications */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Pill className="w-5 h-5" style={{ color: CORAL }} /> Today&apos;s Medications
            </h2>
            <Link
              href="/patient/medications"
              className="text-[14px] font-semibold flex items-center gap-1"
              style={{ color: TEAL }}
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {medLogs.length === 0 ? (
            <p className="text-gray-400 text-[16px] py-4">No medications scheduled for today.</p>
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
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-[16px]">
                        {log.medication_name}
                      </p>
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {timePart}
                      </p>
                    </div>
                    {log.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => markLog(log.id, 'taken')}
                          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                          title="Taken"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => markLog(log.id, 'missed')}
                          className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                          title="Missed"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => markLog(log.id, 'skipped')}
                          className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                          title="Skip"
                        >
                          <SkipForward className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className="px-3 py-1 rounded-full text-[13px] font-semibold capitalize"
                        style={{
                          backgroundColor:
                            log.status === 'taken'
                              ? '#DCFCE7'
                              : log.status === 'missed'
                                ? '#FEE2E2'
                                : '#F3F4F6',
                          color:
                            log.status === 'taken'
                              ? '#166534'
                              : log.status === 'missed'
                                ? '#991B1B'
                                : '#4B5563',
                        }}
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
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5" style={{ color: LAVENDER }} /> Upcoming
              Appointments
            </h2>
            <Link
              href="/patient/appointments"
              className="text-[14px] font-semibold flex items-center gap-1"
              style={{ color: TEAL }}
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {appointments.length === 0 ? (
            <p className="text-gray-400 text-[16px] py-4">No upcoming appointments.</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="font-semibold text-gray-800 text-[16px]">{apt.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <CalendarCheck className="w-3.5 h-3.5" /> {apt.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {apt.time}
                    </span>
                  </div>
                  {apt.doctor_name && (
                    <p className="text-sm text-gray-400 mt-1">Dr. {apt.doctor_name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5" style={{ color: CORAL }} /> Recent Alerts
            </h2>
          </div>
          {alerts.length === 0 ? (
            <p className="text-gray-400 text-[16px] py-4">No open alerts — that&apos;s great!</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const severityColors: Record<string, { bg: string; text: string }> = {
                  low: { bg: '#F0FDF4', text: '#166534' },
                  medium: { bg: '#FEF9C3', text: '#854D0E' },
                  high: { bg: '#FEF2F2', text: '#991B1B' },
                  emergency: { bg: '#FEE2E2', text: '#DC2626' },
                };
                const sc = severityColors[alert.severity] ?? severityColors.low;
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-4 p-4 rounded-xl border"
                    style={{ backgroundColor: sc.bg, borderColor: `${sc.text}20` }}
                  >
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: sc.text }} />
                    <div className="flex-1">
                      <p className="font-semibold text-[16px]" style={{ color: sc.text }}>
                        {alert.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[12px] font-bold uppercase"
                      style={{ backgroundColor: `${sc.text}15`, color: sc.text }}
                    >
                      {alert.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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

export default function PatientTodayPage() {
  return (
    <AuthGuard allowedRoles={['patient']}>
      <AppLayout>
        <TodayContent />
      </AppLayout>
    </AuthGuard>
  );
}
