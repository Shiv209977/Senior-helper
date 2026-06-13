'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { Brain, Play, AlertTriangle, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { listAssessments, runAssessment } from '@/lib/api/ai';
import type { AIRiskAssessment } from '@/lib/api/types';
import { toast } from 'sonner';
import { PageHeader, Spinner } from '@/components/ui-kit';
import { formatDate } from '@/lib/format';

const CATEGORY: Record<string, { chip: string; text: string; ring: string; tile: string }> = {
  low: { chip: 'bg-teal-soft text-teal-deep', text: 'text-teal-deep', ring: 'var(--teal)', tile: 'bg-teal-soft text-teal-deep' },
  medium: { chip: 'bg-gold/20 text-ink', text: 'text-ink', ring: 'var(--gold)', tile: 'bg-gold/20 text-ink' },
  high: { chip: 'bg-coral-soft text-coral', text: 'text-coral', ring: 'var(--coral)', tile: 'bg-coral-soft text-coral' },
  emergency: { chip: 'bg-coral text-white', text: 'text-coral', ring: 'var(--coral)', tile: 'bg-coral-soft text-coral' },
};

function AIContent() {
  const [assessments, setAssessments] = useState<AIRiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [latest, setLatest] = useState<AIRiskAssessment | null>(null);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAssessments(1);
      setAssessments(res.results);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleRun = async () => {
    setError('');
    setRunning(true);
    try {
      const result = await runAssessment();
      setLatest(result);
      toast.success('Assessment complete');
      fetchAssessments();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const TrendIcon = (dir: string) => {
    if (dir === 'up') return <TrendingUp className="h-4 w-4 text-coral" />;
    if (dir === 'down') return <TrendingDown className="h-4 w-4 text-sage" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div>
      <PageHeader
        icon={<Brain className="h-6 w-6" />}
        title="AI Risk Assessment"
        subtitle="Get an AI-powered health risk check"
        accent="lavender"
        action={
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 rounded-full bg-lavender px-6 py-3 text-[16px] font-semibold text-white shadow-soft transition-all hover:bg-lavender-deep hover:shadow-lift disabled:opacity-50"
          >
            <Play className="h-5 w-5" /> {running ? 'Running…' : 'Run Assessment'}
          </button>
        }
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
          {error}
        </div>
      )}

      {/* Latest result */}
      {latest && (
        <div className="animate-rise shadow-soft mb-8 rounded-[1.5rem] border-2 border-lavender/40 bg-card p-6">
          <h2 className="mb-4 text-2xl">Latest Result</h2>
          <div className="flex flex-col gap-6 md:flex-row">
            {/* Score */}
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={CATEGORY[latest.risk_category]?.ring ?? 'var(--teal)'}
                    strokeWidth="8"
                    strokeDasharray={`${latest.risk_score * 2.64} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`font-serif text-3xl font-semibold ${CATEGORY[latest.risk_category]?.text}`}>
                    {latest.risk_score}
                  </span>
                </div>
              </div>
              <div>
                <span
                  className={`rounded-full px-3 py-1 text-[14px] font-bold uppercase tracking-wide ${CATEGORY[latest.risk_category]?.chip}`}
                >
                  {latest.risk_category}
                </span>
                <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  {TrendIcon(latest.risk_trend.direction)} {latest.risk_trend.message}
                </div>
              </div>
            </div>

            {/* Reasons */}
            <div className="flex-1">
              <h3 className="mb-2 font-serif text-lg text-ink">Key Findings</h3>
              <ul className="space-y-1.5">
                {latest.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] text-muted-foreground">
                    <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${CATEGORY[latest.risk_category]?.text}`} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested action */}
          <div className="mt-4 rounded-2xl bg-teal-soft p-4">
            <p className="font-serif text-[16px] font-semibold text-teal-deep">Suggested Action</p>
            <p className="mt-1 text-[15px] text-ink">{latest.suggested_action}</p>
          </div>

          {/* Disclaimer — ALWAYS shown */}
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/10 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <p className="text-[14px] text-ink">{latest.disclaimer}</p>
          </div>
        </div>
      )}

      {/* History */}
      <h2 className="mb-4 text-2xl">Assessment History</h2>
      {loading ? (
        <Spinner className="py-16" />
      ) : assessments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-soft">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-lavender-soft">
            <Brain className="h-8 w-8 text-lavender" />
          </span>
          <p className="text-xl text-ink">No assessments yet</p>
          <p className="mt-1 text-muted-foreground">Click &ldquo;Run Assessment&rdquo; to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((a, i) => {
            const c = CATEGORY[a.risk_category] ?? CATEGORY.low;
            const dateLabel = a.created_at.split('T')[0] ?? '';
            return (
              <div
                key={a.id}
                className="animate-rise flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
                style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
              >
                <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl font-serif text-xl font-semibold ${c.tile}`}>
                  {a.risk_score}
                </div>
                <div className="flex-1">
                  <p className="text-[16px] font-semibold text-ink">{a.risk_category.toUpperCase()} Risk</p>
                  <p className="text-sm text-muted-foreground">{a.reasons[0] ?? 'No findings'}</p>
                </div>
                <span className="text-sm text-muted-foreground">{formatDate(dateLabel)}</span>
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

export default function AIAssessmentPage() {
  return (
    <AuthGuard allowedRoles={['patient']}>
      <AppLayout>
        <AIContent />
      </AppLayout>
    </AuthGuard>
  );
}
