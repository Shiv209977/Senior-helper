'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { Brain, Play, AlertTriangle, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { listAssessments, runAssessment } from '@/lib/api/ai';
import type { AIRiskAssessment } from '@/lib/api/types';

const TEAL = '#1B7A6E';
const LAVENDER = '#7B68AE';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: '#F0FDF4', text: '#166534' },
  medium: { bg: '#FEF9C3', text: '#854D0E' },
  high: { bg: '#FEF2F2', text: '#991B1B' },
  emergency: { bg: '#FEE2E2', text: '#DC2626' },
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
      fetchAssessments();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const TrendIcon = (dir: string) => {
    if (dir === 'up') return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (dir === 'down') return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-8 h-8" style={{ color: LAVENDER }} /> AI Risk Assessment
          </h1>
          <p className="text-gray-500 text-lg mt-1">Get an AI-powered health risk check</p>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-[16px] hover:opacity-90 disabled:opacity-50 transition"
          style={{ backgroundColor: LAVENDER }}
        >
          <Play className="w-5 h-5" /> {running ? 'Running…' : 'Run Assessment'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[15px]">
          {error}
        </div>
      )}

      {/* Latest result */}
      {latest && (
        <div className="mb-8 bg-white rounded-2xl border-2 p-6" style={{ borderColor: LAVENDER }}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Result</h2>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Score */}
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={CATEGORY_COLORS[latest.risk_category]?.text ?? TEAL}
                    strokeWidth="8"
                    strokeDasharray={`${latest.risk_score * 2.64} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: CATEGORY_COLORS[latest.risk_category]?.text }}
                  >
                    {latest.risk_score}
                  </span>
                </div>
              </div>
              <div>
                <span
                  className="px-3 py-1 rounded-full text-[14px] font-bold uppercase"
                  style={{
                    backgroundColor: CATEGORY_COLORS[latest.risk_category]?.bg,
                    color: CATEGORY_COLORS[latest.risk_category]?.text,
                  }}
                >
                  {latest.risk_category}
                </span>
                <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                  {TrendIcon(latest.risk_trend.direction)} {latest.risk_trend.message}
                </div>
              </div>
            </div>

            {/* Reasons */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-700 mb-2">Key Findings</h3>
              <ul className="space-y-1">
                {latest.reasons.map((r, i) => (
                  <li key={i} className="text-[15px] text-gray-600 flex items-start gap-2">
                    <AlertTriangle
                      className="w-4 h-4 mt-0.5 shrink-0"
                      style={{ color: CATEGORY_COLORS[latest.risk_category]?.text }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested action */}
          <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: '#E8F5F2' }}>
            <p className="font-semibold text-[15px]" style={{ color: TEAL }}>
              Suggested Action
            </p>
            <p className="text-[15px] text-gray-700 mt-1">{latest.suggested_action}</p>
          </div>

          {/* Disclaimer — ALWAYS shown */}
          <div className="mt-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-[14px] text-yellow-800">{latest.disclaimer}</p>
          </div>
        </div>
      )}

      {/* History */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Assessment History</h2>
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
      ) : assessments.length === 0 ? (
        <div className="text-center py-16">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-xl text-gray-400">No assessments yet</p>
          <p className="text-gray-400 mt-1">Click &ldquo;Run Assessment&rdquo; to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => {
            const sc = CATEGORY_COLORS[a.risk_category] ?? CATEGORY_COLORS.low;
            const dateLabel = a.created_at.split('T')[0] ?? '';
            return (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl"
                  style={{ backgroundColor: sc.bg, color: sc.text }}
                >
                  {a.risk_score}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-[16px]">
                    {a.risk_category.toUpperCase()} Risk
                  </p>
                  <p className="text-sm text-gray-400">{a.reasons[0] ?? 'No findings'}</p>
                </div>
                <span className="text-sm text-gray-400">{dateLabel}</span>
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
