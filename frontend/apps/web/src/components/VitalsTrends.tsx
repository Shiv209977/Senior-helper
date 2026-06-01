'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { VitalSign } from '@/lib/api/types';
import { formatDate } from '@/lib/format';

type MetricKey = 'heart_rate' | 'oxygen_level' | 'pain_level' | 'fatigue_level' | 'temperature';

const METRICS: { key: MetricKey; label: string; unit: string; color: string; domain?: [number, number] }[] = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', color: 'var(--chart-3)' },
  { key: 'oxygen_level', label: 'SpO₂', unit: '%', color: 'var(--chart-1)', domain: [88, 100] },
  { key: 'pain_level', label: 'Pain', unit: '/10', color: 'var(--chart-3)', domain: [0, 10] },
  { key: 'fatigue_level', label: 'Fatigue', unit: '/10', color: 'var(--chart-2)', domain: [0, 10] },
  { key: 'temperature', label: 'Temp', unit: '°C', color: 'var(--chart-4)' },
];

function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lift">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="font-serif text-lg text-ink">
        {payload[0].value}
        <span className="ml-1 text-[13px] font-sans text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

export default function VitalsTrends({ vitals }: { vitals: VitalSign[] }) {
  const [metric, setMetric] = useState<MetricKey>('heart_rate');
  const active = METRICS.find((m) => m.key === metric)!;

  const data = useMemo(() => {
    return [...vitals]
      .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
      .map((v) => {
        const raw = v[metric as keyof VitalSign];
        const value = metric === 'temperature' ? (raw == null ? null : Number(raw)) : (raw as number | null);
        return { date: formatDate(v.recorded_at).slice(0, 5), value };
      })
      .filter((d) => d.value != null);
  }, [vitals, metric]);

  return (
    <div className="animate-rise mb-6 rounded-[1.5rem] border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-2xl">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-soft">
            <TrendingUp className="h-5 w-5 text-teal" />
          </span>
          Trends
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                metric === m.key
                  ? 'bg-teal text-white'
                  : 'bg-muted text-muted-foreground hover:bg-teal-soft hover:text-teal-deep'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {data.length < 2 ? (
        <p className="py-12 text-center text-muted-foreground">
          Log a few more readings to see your {active.label.toLowerCase()} trend.
        </p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="lwArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={active.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={active.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                minTickGap={20}
              />
              <YAxis
                domain={active.domain ?? ['auto', 'auto']}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip unit={active.unit} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={active.color}
                strokeWidth={2.5}
                fill="url(#lwArea)"
                dot={{ r: 2.5, fill: active.color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
