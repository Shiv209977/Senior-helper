'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { Shield, Search, Save, X, UserCheck, UserX } from 'lucide-react';
import { listUsers, updateUser } from '@/lib/api/admin';
import type { User } from '@/lib/api/types';

const TEAL = '#1B7A6E';

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
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-8 h-8" style={{ color: TEAL }} /> User Management
        </h1>
        <p className="text-gray-500 text-lg mt-1">{totalCount} total users</p>
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
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-4 text-[14px] font-semibold text-gray-500">Name</th>
                    <th className="px-6 py-4 text-[14px] font-semibold text-gray-500">Email</th>
                    <th className="px-6 py-4 text-[14px] font-semibold text-gray-500">Role</th>
                    <th className="px-6 py-4 text-[14px] font-semibold text-gray-500">Phone</th>
                    <th className="px-6 py-4 text-[14px] font-semibold text-gray-500">Status</th>
                    <th className="px-6 py-4 text-[14px] font-semibold text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-[15px] font-medium text-gray-800">
                        {u.full_name}
                      </td>
                      <td className="px-6 py-4 text-[15px] text-gray-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className="px-2 py-0.5 rounded-full text-[12px] font-bold capitalize"
                          style={{
                            backgroundColor:
                              u.role === 'admin'
                                ? '#F3EFF8'
                                : u.role === 'caregiver'
                                  ? '#E8F5F2'
                                  : '#FEF9C3',
                            color:
                              u.role === 'admin'
                                ? '#7B68AE'
                                : u.role === 'caregiver'
                                  ? TEAL
                                  : '#854D0E',
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[15px] text-gray-500">{u.phone || '—'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[12px] font-bold ${u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(u)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                            title="Edit"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {u.is_active ? (
                              <UserX className="w-4 h-4 text-red-400" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-green-500" />
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
            <div className="flex justify-center gap-2 mt-6">
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

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
            <button
              onClick={() => setEditUser(null)}
              className="absolute top-4 right-4 p-1 text-gray-400"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                />
              </div>
              <div className="text-sm text-gray-400">Email and role cannot be changed.</div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition"
                style={{ backgroundColor: TEAL }}
              >
                <Save className="w-5 h-5" /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
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

export default function AdminPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AppLayout>
        <AdminContent />
      </AppLayout>
    </AuthGuard>
  );
}
