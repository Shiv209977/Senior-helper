'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { Pill, Plus, X, Clock } from 'lucide-react';
import { listMedications, createMedication } from '@/lib/api/medications';
import type { Medication } from '@/lib/api/types';

const TEAL = '#1B7A6E';

function MedicationsContent() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [freqType, setFreqType] = useState<'once_daily' | 'twice_daily' | 'custom'>('once_daily');
  const [times, setTimes] = useState('09:00');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    setStartDate(new Date().toISOString().split('T')[0]);
  }, []);

  const fetchMeds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMedications(page);
      setMeds(res.results);
      setTotalCount(res.count);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchMeds();
  }, [fetchMeds]);

  const handleCreate = async () => {
    setFormError('');
    setFormLoading(true);
    try {
      const scheduledTimes = times
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await createMedication({
        medicine_name: name,
        dosage,
        start_date: startDate,
        end_date: endDate || null,
        frequency_type: freqType,
        scheduled_times: scheduledTimes,
        instructions,
      });
      setShowForm(false);
      setName('');
      setDosage('');
      setInstructions('');
      setTimes('09:00');
      fetchMeds();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Pill className="w-8 h-8" style={{ color: '#D4686A' }} /> Medications
          </h1>
          <p className="text-gray-500 text-lg mt-1">Manage your medication schedule</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-[16px] hover:opacity-90 transition"
          style={{ backgroundColor: TEAL }}
        >
          <Plus className="w-5 h-5" /> Add Medication
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[15px]">
          {error}
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">New Medication</h2>
            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-[14px]">
                {formError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                  placeholder="e.g. Metformin"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                  Dosage *
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                  placeholder="e.g. 500mg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={freqType}
                  onChange={(e) => setFreqType(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                >
                  <option value="once_daily">Once Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                  Scheduled Times (comma-separated)
                </label>
                <input
                  type="text"
                  value={times}
                  onChange={(e) => setTimes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                  placeholder="09:00, 21:00"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                  Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2 resize-none"
                  placeholder="Take with food"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={formLoading || !name || !dosage}
                className="w-full py-3 rounded-xl text-white font-semibold text-[16px] hover:opacity-90 disabled:opacity-50 transition"
                style={{ backgroundColor: TEAL }}
              >
                {formLoading ? 'Saving…' : 'Save Medication'}
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
      ) : meds.length === 0 ? (
        <div className="text-center py-20">
          <Pill className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-xl text-gray-400">No medications yet</p>
          <p className="text-gray-400 mt-1">Click &ldquo;Add Medication&rdquo; to get started</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {meds.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#FEF2F2' }}
                >
                  <Pill className="w-6 h-6" style={{ color: '#D4686A' }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-[17px]">{m.medicine_name}</p>
                  <p className="text-sm text-gray-400">
                    {m.dosage} · {m.frequency_type.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <p className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {m.scheduled_times.join(', ')}
                  </p>
                  <p>
                    {m.start_date}
                    {m.end_date ? ` — ${m.end_date}` : ''}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[12px] font-bold ${m.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {m.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
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

export default function MedicationsPage() {
  return (
    <AuthGuard allowedRoles={['patient']}>
      <AppLayout>
        <MedicationsContent />
      </AppLayout>
    </AuthGuard>
  );
}
