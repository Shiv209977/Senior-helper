'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { CalendarCheck, Plus, X, Clock } from 'lucide-react';
import { listAppointments, createAppointment } from '@/lib/api/appointments';
import type { Appointment } from '@/lib/api/types';

const TEAL = '#1B7A6E';
const LAVENDER = '#7B68AE';

const APT_TYPES = ['consultation', 'treatment', 'scan', 'lab_test', 'follow_up', 'other'] as const;

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

  const statusColors: Record<string, { bg: string; text: string }> = {
    upcoming: { bg: '#E8F5F2', text: TEAL },
    completed: { bg: '#DCFCE7', text: '#166534' },
    missed: { bg: '#FEE2E2', text: '#991B1B' },
    cancelled: { bg: '#F3F4F6', text: '#6B7280' },
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarCheck className="w-8 h-8" style={{ color: LAVENDER }} /> Appointments
          </h1>
          <p className="text-gray-500 text-lg mt-1">View and schedule your appointments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-[16px] hover:opacity-90 transition"
          style={{ backgroundColor: TEAL }}
        >
          <Plus className="w-5 h-5" /> New Appointment
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[15px]">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">New Appointment</h2>
            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-[14px]">
                {formError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                  placeholder="e.g. Oncology check-up"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">Type</label>
                <select
                  value={aptType}
                  onChange={(e) => setAptType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                >
                  {APT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                  Hospital
                </label>
                <input
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">Doctor</label>
                <input
                  type="text"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2 resize-none"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={formLoading || !title || !date || !time}
                className="w-full py-3 rounded-xl text-white font-semibold text-[16px] hover:opacity-90 disabled:opacity-50 transition"
                style={{ backgroundColor: TEAL }}
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
            className="w-10 h-10 border-4 border-t-transparent rounded-full"
            style={{
              borderColor: TEAL,
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      ) : apts.length === 0 ? (
        <div className="text-center py-20">
          <CalendarCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-xl text-gray-400">No appointments yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {apts.map((a) => {
              const sc = statusColors[a.status] ?? statusColors.upcoming;
              return (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#F3EFF8' }}
                  >
                    <CalendarCheck className="w-6 h-6" style={{ color: LAVENDER }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-[17px]">{a.title}</p>
                    <p className="text-sm text-gray-400">
                      {a.appointment_type.replace('_', ' ')}{' '}
                      {a.doctor_name ? `· Dr. ${a.doctor_name}` : ''}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <p className="flex items-center gap-1 justify-end">
                      <CalendarCheck className="w-3.5 h-3.5" /> {a.date}
                    </p>
                    <p className="flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5" /> {a.time}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-[12px] font-bold capitalize"
                    style={{ backgroundColor: sc.bg, color: sc.text }}
                  >
                    {a.status}
                  </span>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-10 h-10 rounded-lg font-semibold text-[15px] transition"
                  style={{
                    backgroundColor: page === p ? TEAL : '#F3F4F6',
                    color: page === p ? 'white' : '#6B7280',
                  }}
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
