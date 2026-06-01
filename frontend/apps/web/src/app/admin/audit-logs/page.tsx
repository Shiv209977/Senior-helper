'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { FileText } from 'lucide-react';
import { listAuditLogs } from '@/lib/api/admin';
import type { AuditLog } from '@/lib/api/types';

const TEAL = '#1B7A6E';

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAuditLogs(page);
      setLogs(res.results);
      setTotalCount(res.count);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="w-8 h-8" style={{ color: TEAL }} /> Audit Logs
        </h1>
        <p className="text-gray-500 text-lg mt-1">{totalCount} log entries</p>
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
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-xl text-gray-400">No audit logs</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-4 text-[14px] font-semibold text-gray-500">User</th>
                    <th className="px-6 py-4 text-[14px] font-semibold text-gray-500">Action</th>
                    <th className="px-6 py-4 text-[14px] font-semibold text-gray-500">Metadata</th>
                    <th className="px-6 py-4 text-[14px] font-semibold text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const dateLabel = log.created_at.split('T')[0] ?? '';
                    const metaStr = JSON.stringify(log.metadata).slice(0, 100);
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 text-[15px] text-gray-800">{log.user_email}</td>
                        <td className="px-6 py-4 text-[15px] font-medium text-gray-700">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 text-[13px] text-gray-400 font-mono max-w-[200px] truncate">
                          {metaStr}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-gray-400">{dateLabel}</td>
                      </tr>
                    );
                  })}
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

export default function AuditLogsPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AppLayout>
        <AuditLogsContent />
      </AppLayout>
    </AuthGuard>
  );
}
