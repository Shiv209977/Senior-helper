'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { FileText } from 'lucide-react';
import { listAuditLogs } from '@/lib/api/admin';
import type { AuditLog } from '@/lib/api/types';
import { PageHeader, EmptyState, Spinner } from '@/components/ui-kit';
import { formatDate } from '@/lib/format';

const thClass = 'px-6 py-4 text-[14px] font-semibold text-muted-foreground';

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
      <PageHeader
        icon={<FileText className="h-6 w-6" />}
        title="Audit Logs"
        subtitle={`${totalCount} log entries`}
        accent="teal"
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : logs.length === 0 ? (
        <EmptyState icon={<FileText className="h-8 w-8" />} title="No audit logs" accent="teal" />
      ) : (
        <>
          <div className="animate-rise overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className={thClass}>User</th>
                    <th className={thClass}>Action</th>
                    <th className={thClass}>Metadata</th>
                    <th className={thClass}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const dateLabel = log.created_at.split('T')[0] ?? '';
                    const metaStr = JSON.stringify(log.metadata).slice(0, 100);
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-border/60 transition-colors hover:bg-muted/40"
                      >
                        <td className="px-6 py-4 text-[15px] text-ink">{log.user_email}</td>
                        <td className="px-6 py-4 text-[15px] font-medium text-ink">
                          {log.action}
                        </td>
                        <td className="max-w-[200px] truncate px-6 py-4 font-mono text-[13px] text-muted-foreground">
                          {metaStr}
                        </td>
                        <td className="px-6 py-4 text-[14px] text-muted-foreground">{formatDate(dateLabel)}</td>
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

export default function AuditLogsPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AppLayout>
        <AuditLogsContent />
      </AppLayout>
    </AuthGuard>
  );
}
