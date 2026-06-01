'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { AlertTriangle, Phone, X } from 'lucide-react';
import { listEmergencies, createEmergency } from '@/lib/api/emergencies';
import type { EmergencyRequest } from '@/lib/api/types';

const STATUS_PILL: Record<string, string> = {
  active: 'bg-coral text-white',
  acknowledged: 'bg-gold/20 text-ink',
  resolved: 'bg-teal-soft text-teal-deep',
  cancelled: 'bg-muted text-muted-foreground',
};

function EmergenciesContent() {
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const fetchEmergencies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listEmergencies(1);
      setEmergencies(res.results);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencies();
  }, [fetchEmergencies]);

  const handleTrigger = async () => {
    setError('');
    setSending(true);
    try {
      await createEmergency({ message });
      setShowConfirm(false);
      setMessage('');
      fetchEmergencies();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const hasActive = emergencies.some((e) => e.status === 'active');

  return (
    <div>
      <div className="animate-rise mb-8">
        <h1 className="flex items-center gap-3 text-4xl">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-coral-soft">
            <AlertTriangle className="h-6 w-6 text-coral" />
          </span>
          Emergency
        </h1>
        <p className="mt-2 text-xl text-muted-foreground">Request urgent help from your care team</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
          {error}
        </div>
      )}

      {/* Big emergency button */}
      <div className="animate-rise relative mb-8 overflow-hidden rounded-[1.5rem] border border-coral/20 bg-coral-soft p-8 text-center shadow-soft">
        <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-white shadow-soft">
          <AlertTriangle className="h-8 w-8 text-coral" />
        </span>
        <h2 className="mb-2 text-3xl">Need Urgent Help?</h2>
        <p className="mx-auto mb-6 max-w-md text-lg text-muted-foreground">
          Press the button below to alert your caregivers and care team immediately.
        </p>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={hasActive}
          className="rounded-2xl bg-coral px-10 py-4 text-xl font-bold text-white shadow-soft transition-all hover:bg-destructive hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Phone className="mr-2 inline h-6 w-6" />
          {hasActive ? 'Emergency Already Active' : '🚨 Trigger Emergency'}
        </button>
        {hasActive && (
          <p className="mt-3 text-sm text-muted-foreground">
            You already have an active emergency. Your team has been notified.
          </p>
        )}
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="shadow-lift relative w-full max-w-md rounded-[1.75rem] bg-card p-8 text-center">
            <button
              onClick={() => setShowConfirm(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
            >
              <X className="h-6 w-6" />
            </button>
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-coral-soft">
              <AlertTriangle className="h-7 w-7 text-coral" />
            </span>
            <h2 className="mb-2 text-2xl">Confirm Emergency</h2>
            <p className="mb-4 text-muted-foreground">
              Are you sure you want to trigger an emergency alert? Your caregivers will be notified
              immediately.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="mb-4 w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-[16px] text-ink transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
              placeholder="Optional: describe your situation"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-full border-2 border-border py-3 font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={handleTrigger}
                disabled={sending}
                className="flex-1 rounded-full bg-coral py-3 font-semibold text-white transition-colors hover:bg-destructive disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Yes, Alert Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <h2 className="mb-4 text-2xl">Emergency History</h2>
      {loading ? (
        <div className="flex justify-center py-16">
          <div
            className="h-11 w-11 rounded-full border-4 border-teal-soft border-t-teal"
            style={{ animation: 'spin 0.9s linear infinite' }}
          />
        </div>
      ) : emergencies.length === 0 ? (
        <p className="text-[16px] text-muted-foreground">No emergency history</p>
      ) : (
        <div className="space-y-3">
          {emergencies.map((e, i) => {
            const dateLabel = e.created_at.split('T')[0] ?? '';
            const isActive = e.status === 'active';
            return (
              <div
                key={e.id}
                className="animate-rise flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
                style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
              >
                <AlertTriangle className={`h-6 w-6 shrink-0 ${isActive ? 'text-coral' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <p className="text-[16px] font-semibold capitalize text-ink">{e.emergency_type}</p>
                  {e.message && <p className="text-sm text-muted-foreground">{e.message}</p>}
                </div>
                <span className="text-sm text-muted-foreground">{dateLabel}</span>
                <span
                  className={`rounded-full px-3 py-1 text-[12px] font-bold capitalize ${STATUS_PILL[e.status] ?? STATUS_PILL.cancelled}`}
                >
                  {e.status}
                </span>
              </div>
            );
          })}
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

export default function EmergenciesPage() {
  return (
    <AuthGuard allowedRoles={['patient']}>
      <AppLayout>
        <EmergenciesContent />
      </AppLayout>
    </AuthGuard>
  );
}
