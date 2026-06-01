'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { AlertTriangle, Phone, X } from 'lucide-react';
import { listEmergencies, createEmergency } from '@/lib/api/emergencies';
import type { EmergencyRequest } from '@/lib/api/types';

const TEAL = '#1B7A6E';

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" /> Emergency
          </h1>
          <p className="text-gray-500 text-lg mt-1">Request urgent help from your care team</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[15px]">
          {error}
        </div>
      )}

      {/* Big emergency button */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mb-8">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Need Urgent Help?</h2>
        <p className="text-gray-500 text-lg mb-6 max-w-md mx-auto">
          Press the button below to alert your caregivers and care team immediately.
        </p>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={hasActive}
          className="px-10 py-4 rounded-2xl text-white text-xl font-bold bg-red-500 hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Phone className="w-6 h-6 inline mr-2" />
          {hasActive ? 'Emergency Already Active' : '🚨 Trigger Emergency'}
        </button>
        {hasActive && (
          <p className="text-sm text-gray-400 mt-3">
            You already have an active emergency. Your team has been notified.
          </p>
        )}
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative text-center">
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute top-4 right-4 p-1 text-gray-400"
            >
              <X className="w-6 h-6" />
            </button>
            <AlertTriangle className="w-14 h-14 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Emergency</h2>
            <p className="text-gray-500 mb-4">
              Are you sure you want to trigger an emergency alert? Your caregivers will be notified
              immediately.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2 resize-none mb-4"
              placeholder="Optional: describe your situation"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTrigger}
                disabled={sending}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Yes, Alert Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency History</h2>
      {loading ? (
        <div className="flex justify-center py-16">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full"
            style={{
              borderColor: TEAL,
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      ) : emergencies.length === 0 ? (
        <p className="text-gray-400 text-[16px]">No emergency history</p>
      ) : (
        <div className="space-y-3">
          {emergencies.map((e) => {
            const statusColors: Record<string, { bg: string; text: string }> = {
              active: { bg: '#FEE2E2', text: '#DC2626' },
              acknowledged: { bg: '#FEF9C3', text: '#854D0E' },
              resolved: { bg: '#DCFCE7', text: '#166534' },
              cancelled: { bg: '#F3F4F6', text: '#6B7280' },
            };
            const sc = statusColors[e.status] ?? statusColors.cancelled;
            const dateLabel = e.created_at.split('T')[0] ?? '';
            return (
              <div
                key={e.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
              >
                <AlertTriangle className="w-6 h-6" style={{ color: sc.text }} />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-[16px]">{e.emergency_type}</p>
                  {e.message && <p className="text-sm text-gray-400">{e.message}</p>}
                </div>
                <span className="text-sm text-gray-400">{dateLabel}</span>
                <span
                  className="px-3 py-1 rounded-full text-[12px] font-bold capitalize"
                  style={{ backgroundColor: sc.bg, color: sc.text }}
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
