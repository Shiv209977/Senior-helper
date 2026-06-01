'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { CalendarCheck, Plus, X, Clock } from 'lucide-react';
import { listAppointments, createAppointment } from '@/lib/api/appointments';
import type { Appointment } from '@/lib/api/types';

const inputClass =
  'w-full rounded-xl border border-border bg-card px-4 py-3 text-[16px] text-ink transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/55';
const labelClass = 'mb-1 block text-[14px] font-semibold text-ink';

const APT_TYPES = ['consultation', 'treatment', 'scan', 'lab_test', 'follow_up', 'other'] as const;

const STATUS_PILL: Record<string, string> = {
  upcoming: 'bg-teal-soft text-teal-deep',
  completed: 'bg-sage/20 text-sage',
  missed: 'bg-coral-soft text-coral',
  cancelled: 'bg-muted text-muted-foreground',
};

function AppointmentsContent() {
  const [apts, setApts] = useState<Appointment[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [aptType, setAptType] = useState<string>('consultation');
  const [hospital, setHospital] = useState('');
  const [doctor, setDoctor] = useState('');
  const [notes, setNotes] = useState('');

  const fetchApts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAppointments(page);
      setApts(res.results);
      setTotalCount(res.count);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchApts();
  }, [fetchApts]);

  const handleCreate = async () => {
    setFormError('');
    setFormLoading(true);
    try {
      await createAppointment({
        title,
        date,
        time,
        appointment_type: aptType,
        hospital_name: hospital,
        doctor_name: doctor,
        notes,
      });
      setShowForm(false);
      setTitle('');
      setDate('');
      setTime('');
      setHospital('');
      setDoctor('');
      setNotes('');
      fetchApts();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div>
      <div className="animate-rise mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-4xl">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lavender-soft">
              <CalendarCheck className="h-6 w-6 text-lavender" />
            </span>
            Appointments
          </h1>
          <p className="mt-2 text-xl text-muted-foreground">View and schedule your appointments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-[16px] font-semibold text-white shadow-soft transition-all hover:bg-teal-deep hover:shadow-lift"
        >
          <Plus className="h-5 w-5" /> New Appointment
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="shadow-lift relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-card p-8">
            <button
              onClick={() => setShowForm(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="mb-6 text-3xl">New Appointment</h2>
            {formError && (
              <div className="mb-4 rounded-xl bg-coral-soft px-4 py-3 text-[14px] font-medium text-coral">
                {formError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Oncology check-up"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Time *</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <select
                  value={aptType}
                  onChange={(e) => setAptType(e.target.value)}
                  className={inputClass}
                >
                  {APT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Hospital</label>
                <input
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Doctor</label>
                <input
                  type="text"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={formLoading || !title || !date || !time}
                className="w-full rounded-full bg-teal py-3 text-[16px] font-semibold text-white transition-all hover:bg-teal-deep disabled:opacity-50"
              >
                {formLoading ? 'Saving…' : 'Save Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="h-11 w-11 rounded-full border-4 border-teal-soft border-t-teal"
            style={{ animation: 'spin 0.9s linear infinite' }}
          />
        </div>
      ) : apts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-20 text-center shadow-soft">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-lavender-soft">
            <CalendarCheck className="h-8 w-8 text-lavender" />
          </span>
          <p className="text-xl text-ink">No appointments yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {apts.map((a, i) => (
              <div
                key={a.id}
                className="animate-rise flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
                style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lavender-soft">
                  <CalendarCheck className="h-6 w-6 text-lavender" />
                </span>
                <div className="flex-1">
                  <p className="text-[17px] font-bold text-ink">{a.title}</p>
                  <p className="text-sm capitalize text-muted-foreground">
                    {a.appointment_type.replace('_', ' ')}{' '}
                    {a.doctor_name ? `· Dr. ${a.doctor_name}` : ''}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p className="flex items-center justify-end gap-1">
                    <CalendarCheck className="h-3.5 w-3.5" /> {a.date}
                  </p>
                  <p className="flex items-center justify-end gap-1">
                    <Clock className="h-3.5 w-3.5" /> {a.time}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[12px] font-bold capitalize ${STATUS_PILL[a.status] ?? STATUS_PILL.upcoming}`}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-10 w-10 rounded-xl text-[15px] font-semibold transition-colors ${
                    page === p ? 'bg-teal text-white' : 'bg-muted text-muted-foreground hover:bg-teal-soft hover:text-teal-deep'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
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

export default function AppointmentsPage() {
  return (
    <AuthGuard allowedRoles={['patient']}>
      <AppLayout>
        <AppointmentsContent />
      </AppLayout>
    </AuthGuard>
  );
}
