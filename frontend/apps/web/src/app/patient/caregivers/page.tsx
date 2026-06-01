'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { Users, Plus, Copy, CheckCircle, XCircle } from 'lucide-react';
import { listCaregiverLinks, createInvite, revokeLink } from '@/lib/api/caregiver-links';
import type { CaregiverLink } from '@/lib/api/types';

const STATUS_PILL: Record<string, string> = {
  pending: 'bg-gold/20 text-ink',
  active: 'bg-teal-soft text-teal-deep',
  revoked: 'bg-muted text-muted-foreground',
};

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

  return (
    <div>
      <div className="animate-rise mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-4xl">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-soft">
              <Users className="h-6 w-6 text-teal" />
            </span>
            Caregivers
          </h1>
          <p className="mt-2 text-xl text-muted-foreground">Manage your caregiver connections</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-[16px] font-semibold text-white shadow-soft transition-all hover:bg-teal-deep hover:shadow-lift disabled:opacity-50"
        >
          <Plus className="h-5 w-5" /> {creating ? 'Creating…' : 'Generate Invite Code'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="h-11 w-11 rounded-full border-4 border-teal-soft border-t-teal"
            style={{ animation: 'spin 0.9s linear infinite' }}
          />
        </div>
      ) : links.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-20 text-center shadow-soft">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-teal-soft">
            <Users className="h-8 w-8 text-teal" />
          </span>
          <p className="text-xl text-ink">No caregiver links yet</p>
          <p className="mt-1 text-muted-foreground">
            Generate an invite code and share it with your caregiver
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link, i) => (
            <div
              key={link.id}
              className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-soft"
              style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
            >
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-soft">
                  <Users className="h-6 w-6 text-teal" />
                </span>
                <div className="flex-1">
                  <p className="text-[17px] font-bold text-ink">
                    {link.status === 'active'
                      ? link.caregiver_name || 'Caregiver'
                      : 'Pending Invite'}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm text-ink">
                      {link.invite_code}
                    </code>
                    <button
                      onClick={() => handleCopy(link.id, link.invite_code)}
                      aria-label="Copy invite code"
                      className="p-1 text-muted-foreground transition-colors hover:text-teal"
                    >
                      {copied === link.id ? (
                        <CheckCircle className="h-4 w-4 text-teal" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[12px] font-bold capitalize ${STATUS_PILL[link.status] ?? STATUS_PILL.pending}`}
                >
                  {link.status}
                </span>
                {link.status !== 'revoked' && (
                  <button
                    onClick={() => handleRevoke(link.id)}
                    className="p-2 text-muted-foreground transition-colors hover:text-coral"
                    title="Revoke"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
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
