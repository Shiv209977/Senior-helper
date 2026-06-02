'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { Shield, Search, Save, X, UserCheck, UserX, FlaskConical } from 'lucide-react';
import { listUsers, updateUser } from '@/lib/api/admin';
import { apiFetch } from '@/lib/api/client';
import type { User } from '@/lib/api/types';
import { toast } from 'sonner';
import { PageHeader, Spinner, Toggle, useDialogA11y } from '@/components/ui-kit';

const inputClass =
  'w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3 text-[16px] text-ink transition-colors focus:border-ring focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/55';
const labelClass = 'mb-1 block text-[14px] font-semibold text-ink';
const thClass = 'px-6 py-4 text-[14px] font-semibold text-muted-foreground';

const ROLE_PILL: Record<string, string> = {
  admin: 'bg-lavender-soft text-lavender-deep',
  caregiver: 'bg-teal-soft text-teal-deep',
  patient: 'bg-gold/20 text-ink',
};

function AdminContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const [llmNotes, setLlmNotes] = useState(false);
  const [llmToggling, setLlmToggling] = useState(false);

  useEffect(() => {
    apiFetch<{ llm_notes_analysis: boolean }>('/settings/demo/')
      .then((d) => setLlmNotes(d.llm_notes_analysis))
      .catch(() => {});
  }, []);

  const handleLlmToggle = async () => {
    setLlmToggling(true);
    try {
      const d = await apiFetch<{ llm_notes_analysis: boolean }>('/settings/demo/', { method: 'POST' });
      setLlmNotes(d.llm_notes_analysis);
      toast.success(d.llm_notes_analysis ? 'LLM notes analysis ON' : 'LLM notes analysis OFF');
    } catch {
      toast.error('Could not update setting');
    } finally {
      setLlmToggling(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUsers(page);
      setUsers(res.results);
      setTotalCount(res.count);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (u: User) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (u: User) => {
    setEditUser(u);
    setEditName(u.full_name);
    setEditPhone(u.phone);
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await updateUser(editUser.id, { full_name: editName, phone: editPhone });
      setEditUser(null);
      toast.success('User updated');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const dialogRef = useDialogA11y<HTMLDivElement>(() => setEditUser(null));

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div>
      <PageHeader
        icon={<Shield className="h-6 w-6" />}
        title="User Management"
        subtitle={`${totalCount} total users`}
        accent="teal"
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="animate-rise overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className={thClass}>Name</th>
                    <th className={thClass}>Email</th>
                    <th className={thClass}>Role</th>
                    <th className={thClass}>Phone</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/60 transition-colors hover:bg-muted/40">
                      <td className="px-6 py-4 text-[15px] font-medium text-ink">{u.full_name}</td>
                      <td className="px-6 py-4 text-[15px] text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold capitalize ${ROLE_PILL[u.role] ?? ROLE_PILL.patient}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[15px] text-muted-foreground">{u.phone || '—'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${u.is_active ? 'bg-teal-soft text-teal-deep' : 'bg-coral-soft text-coral'}`}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(u)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
                            title="Edit"
                          >
                            <Search className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className="rounded-lg p-1.5 transition-colors hover:bg-muted"
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {u.is_active ? (
                              <UserX className="h-4 w-4 text-coral" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-teal" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
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

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="shadow-lift relative w-full max-w-md rounded-[1.75rem] bg-card p-8"
          >
            <button
              onClick={() => setEditUser(null)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="mb-6 text-3xl">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="text-sm text-muted-foreground">Email and role cannot be changed.</div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-teal py-3 font-semibold text-white transition-all hover:bg-teal-deep disabled:opacity-50"
              >
                <Save className="h-5 w-5" /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Settings */}
      <div className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-[18px] font-bold text-ink">
          <FlaskConical className="h-5 w-5 text-lavender" /> Demo Settings
        </h2>
        <div className="animate-rise rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[16px] font-semibold text-ink">LLM Notes Analysis</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                When ON, free-text notes in vitals &amp; symptoms are sent to the AI to extract symptom flags.
                Slower but smarter. Uses keyword matching when OFF.
              </p>
            </div>
            <Toggle
              checked={llmNotes}
              onChange={handleLlmToggle}
              disabled={llmToggling}
              color="teal"
              label="LLM Notes Analysis"
            />
          </div>
          <p className="mt-4 text-[12px] text-muted-foreground">
            Note: this setting resets to OFF if the server restarts (stored in memory cache).
          </p>
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

export default function AdminPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AppLayout>
        <AdminContent />
      </AppLayout>
    </AuthGuard>
  );
}
