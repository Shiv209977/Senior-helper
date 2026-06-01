'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { Pill, Plus, X, Clock } from 'lucide-react';
import { listMedications, createMedication } from '@/lib/api/medications';
import type { Medication } from '@/lib/api/types';

const inputClass =
  'w-full rounded-xl border border-border bg-card px-4 py-3 text-[16px] text-ink transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40';
const labelClass = 'mb-1 block text-[14px] font-semibold text-ink';

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
      <div className="animate-rise mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-4xl">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-coral-soft">
              <Pill className="h-6 w-6 text-coral" />
            </span>
            Medications
          </h1>
          <p className="mt-2 text-xl text-muted-foreground">Manage your medication schedule</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-[16px] font-semibold text-white shadow-soft transition-all hover:bg-teal-deep hover:shadow-lift"
        >
          <Plus className="h-5 w-5" /> Add Medication
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
          {error}
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="shadow-lift relative w-full max-w-lg rounded-[1.75rem] bg-card p-8">
            <button
              onClick={() => setShowForm(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="mb-6 text-3xl">New Medication</h2>
            {formError && (
              <div className="mb-4 rounded-xl bg-coral-soft px-4 py-3 text-[14px] font-medium text-coral">
                {formError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Medicine Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Metformin"
                />
              </div>
              <div>
                <label className={labelClass}>Dosage *</label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 500mg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Frequency</label>
                <select
                  value={freqType}
                  onChange={(e) => setFreqType(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="once_daily">Once Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Scheduled Times (comma-separated)</label>
                <input
                  type="text"
                  value={times}
                  onChange={(e) => setTimes(e.target.value)}
                  className={inputClass}
                  placeholder="09:00, 21:00"
                />
              </div>
              <div>
                <label className={labelClass}>Instructions</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-none`}
                  placeholder="Take with food"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={formLoading || !name || !dosage}
                className="w-full rounded-full bg-teal py-3 text-[16px] font-semibold text-white transition-all hover:bg-teal-deep disabled:opacity-50"
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
            className="h-11 w-11 rounded-full border-4 border-teal-soft border-t-teal"
            style={{ animation: 'spin 0.9s linear infinite' }}
          />
        </div>
      ) : meds.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-20 text-center shadow-soft">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-coral-soft">
            <Pill className="h-8 w-8 text-coral" />
          </span>
          <p className="text-xl text-ink">No medications yet</p>
          <p className="mt-1 text-muted-foreground">Click &ldquo;Add Medication&rdquo; to get started</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {meds.map((m, i) => (
              <div
                key={m.id}
                className="animate-rise flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
                style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-coral-soft">
                  <Pill className="h-6 w-6 text-coral" />
                </span>
                <div className="flex-1">
                  <p className="text-[17px] font-bold text-ink">{m.medicine_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.dosage} · {m.frequency_type.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p className="flex items-center justify-end gap-1">
                    <Clock className="h-3.5 w-3.5" /> {m.scheduled_times.join(', ')}
                  </p>
                  <p>
                    {m.start_date}
                    {m.end_date ? ` — ${m.end_date}` : ''}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[12px] font-bold ${m.is_active ? 'bg-teal-soft text-teal-deep' : 'bg-muted text-muted-foreground'}`}
                >
                  {m.is_active ? 'Active' : 'Inactive'}
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

export default function MedicationsPage() {
  return (
    <AuthGuard allowedRoles={['patient']}>
      <AppLayout>
        <MedicationsContent />
      </AppLayout>
    </AuthGuard>
  );
}
