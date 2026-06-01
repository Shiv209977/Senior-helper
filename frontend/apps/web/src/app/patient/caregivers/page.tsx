'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { Users, Plus, Copy, CheckCircle, XCircle } from 'lucide-react';
import { listCaregiverLinks, createInvite, revokeLink } from '@/lib/api/caregiver-links';
import type { CaregiverLink } from '@/lib/api/types';

const TEAL = '#1B7A6E';

function CaregiversContent() {
  const [links, setLinks] = useState<CaregiverLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCaregiverLinks();
      setLinks(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleCreate = async () => {
    setError('');
    setCreating(true);
    try {
      await createInvite();
      fetchLinks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!window.confirm('Revoke this caregiver link?')) return;
    try {
      await revokeLink(id);
      fetchLinks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCopy = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FEF9C3', text: '#854D0E' },
    active: { bg: '#DCFCE7', text: '#166534' },
    revoked: { bg: '#F3F4F6', text: '#6B7280' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8" style={{ color: TEAL }} /> Caregivers
          </h1>
          <p className="text-gray-500 text-lg mt-1">Manage your caregiver connections</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-[16px] hover:opacity-90 disabled:opacity-50 transition"
          style={{ backgroundColor: TEAL }}
        >
          <Plus className="w-5 h-5" /> {creating ? 'Creating…' : 'Generate Invite Code'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[15px]">
          {error}
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
      ) : links.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-xl text-gray-400">No caregiver links yet</p>
          <p className="text-gray-400 mt-1">
            Generate an invite code and share it with your caregiver
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => {
            const sc = statusColors[link.status] ?? statusColors.pending;
            return (
              <div key={link.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#E8F5F2' }}
                  >
                    <Users className="w-6 h-6" style={{ color: TEAL }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-[17px]">
                      {link.status === 'active'
                        ? link.caregiver_name || 'Caregiver'
                        : 'Pending Invite'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-gray-100 px-2 py-0.5 rounded font-mono">
                        {link.invite_code}
                      </code>
                      <button
                        onClick={() => handleCopy(link.id, link.invite_code)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {copied === link.id ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-[12px] font-bold capitalize"
                    style={{ backgroundColor: sc.bg, color: sc.text }}
                  >
                    {link.status}
                  </span>
                  {link.status !== 'revoked' && (
                    <button
                      onClick={() => handleRevoke(link.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition"
                      title="Revoke"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
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

export default function CaregiversPage() {
  return (
    <AuthGuard allowedRoles={['patient']}>
      <AppLayout>
        <CaregiversContent />
      </AppLayout>
    </AuthGuard>
  );
}
