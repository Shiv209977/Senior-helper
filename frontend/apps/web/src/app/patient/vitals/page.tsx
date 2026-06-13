'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { Activity, Plus, X, ThermometerSun, Heart, Droplets, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { listVitals, createVital } from '@/lib/api/vitals';
import { listSymptoms, createSymptom } from '@/lib/api/symptoms';
import type { VitalSign, SymptomRecord } from '@/lib/api/types';
import { PageHeader, useDialogA11y } from '@/components/ui-kit';
import VitalsTrends from '@/components/VitalsTrends';
import { formatDate } from '@/lib/format';

const inputClass =
  'w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3 text-[16px] text-ink transition-colors focus:border-ring focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/55';
const labelClass = 'mb-1 block text-[14px] font-semibold text-ink';

const SYMPTOM_FLAGS = [
  { key: 'fever', label: 'Fever' },
  { key: 'nausea', label: 'Nausea' },
  { key: 'vomiting', label: 'Vomiting' },
  { key: 'severe_pain', label: 'Severe Pain' },
  { key: 'breathing_difficulty', label: 'Breathing Difficulty' },
  { key: 'dizziness', label: 'Dizziness' },
  { key: 'bleeding', label: 'Bleeding' },
  { key: 'fatigue', label: 'Fatigue' },
  { key: 'appetite_loss', label: 'Appetite Loss' },
  { key: 'infection_signs', label: 'Signs of Infection' },
] as const;

function VitalsContent() {
  const [tab, setTab] = useState<'vitals' | 'symptoms'>('vitals');
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Vital form
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [vFormLoading, setVFormLoading] = useState(false);
  const [vFormError, setVFormError] = useState('');
  const [temperature, setTemperature] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [oxygenLevel, setOxygenLevel] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [painLevel, setPainLevel] = useState('0');
  const [fatigueLevel, setFatigueLevel] = useState('0');
  const [appetiteLevel, setAppetiteLevel] = useState('5');
  const [vitalNotes, setVitalNotes] = useState('');

  // Symptom form
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [sFormLoading, setSFormLoading] = useState(false);
  const [sFormError, setSFormError] = useState('');
  const [symptomFlags, setSymptomFlags] = useState<Record<string, boolean>>({});
  const [severityScore, setSeverityScore] = useState('0');
  const [symptomNotes, setSymptomNotes] = useState('');

  const [todayStr, setTodayStr] = useState('');
  const [nowISO, setNowISO] = useState('');

  const vitalDialogRef = useDialogA11y<HTMLDivElement>(() => setShowVitalForm(false));
  const symptomDialogRef = useDialogA11y<HTMLDivElement>(() => setShowSymptomForm(false));

  useEffect(() => {
    const d = new Date();
    setTodayStr(d.toISOString().split('T')[0]);
    setNowISO(d.toISOString());
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, sRes] = await Promise.all([listVitals(1), listSymptoms(1)]);
      setVitals(vRes.results);
      setSymptoms(sRes.results);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreateVital = async () => {
    setVFormError('');
    setVFormLoading(true);
    try {
      // Refresh the timestamp at submission time via state
      const freshNow = nowISO || '2026-01-01T00:00:00.000Z';
      await createVital({
        recorded_at: freshNow,
        temperature: temperature || null,
        heart_rate: heartRate ? parseInt(heartRate) : null,
        oxygen_level: oxygenLevel ? parseInt(oxygenLevel) : null,
        systolic_bp: systolic ? parseInt(systolic) : null,
        diastolic_bp: diastolic ? parseInt(diastolic) : null,
        pain_level: parseInt(painLevel),
        fatigue_level: parseInt(fatigueLevel),
        appetite_level: parseInt(appetiteLevel),
        notes: vitalNotes,
      });
      setShowVitalForm(false);
      setTemperature('');
      setHeartRate('');
      setOxygenLevel('');
      setSystolic('');
      setDiastolic('');
      setPainLevel('0');
      setFatigueLevel('0');
      setAppetiteLevel('5');
      setVitalNotes('');
      toast.success('Vitals logged');
      fetchAll();
    } catch (err: any) {
      setVFormError(err.message);
    } finally {
      setVFormLoading(false);
    }
  };

  const handleCreateSymptom = async () => {
    if (!todayStr) return;
    setSFormError('');
    setSFormLoading(true);
    try {
      await createSymptom({
        symptom_date: todayStr,
        ...symptomFlags,
        symptom_severity_score: parseInt(severityScore),
        notes: symptomNotes,
      });
      setShowSymptomForm(false);
      setSymptomFlags({});
      setSeverityScore('0');
      setSymptomNotes('');
      toast.success('Symptoms logged');
      fetchAll();
    } catch (err: any) {
      setSFormError(err.message);
    } finally {
      setSFormLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={<Activity className="h-6 w-6" />}
        title="Vitals & Symptoms"
        subtitle="Track your health data over time"
        accent="teal"
        action={
          <div className="flex gap-3">
            <button
              onClick={() => setShowVitalForm(true)}
              className="flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-[15px] font-semibold text-white shadow-soft transition-all hover:bg-teal-deep hover:shadow-lift"
            >
              <Plus className="h-4 w-4" /> Log Vitals
            </button>
            <button
              onClick={() => setShowSymptomForm(true)}
              className="flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-[15px] font-semibold text-white shadow-soft transition-all hover:bg-destructive hover:shadow-lift"
            >
              <Plus className="h-4 w-4" /> Log Symptoms
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
          {error}
        </div>
      )}

      {vitals.length > 0 && <VitalsTrends vitals={vitals} />}

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {(['vitals', 'symptoms'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2.5 text-[15px] font-semibold capitalize transition-colors ${
              tab === t ? 'bg-teal-soft text-teal-deep' : 'bg-muted text-muted-foreground hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="h-11 w-11 rounded-full border-4 border-teal-soft border-t-teal"
            style={{ animation: 'spin 0.9s linear infinite' }}
          />
        </div>
      ) : tab === 'vitals' ? (
        vitals.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-soft">
            <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-teal-soft">
              <Activity className="h-8 w-8 text-teal" />
            </span>
            <p className="text-xl text-ink">No vitals logged yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vitals.map((v) => {
              const dateLabel = v.recorded_at.split('T')[0] ?? '';
              return (
                <div key={v.id} className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[17px] font-bold text-ink">Vitals Record</p>
                    <span className="text-sm text-muted-foreground">{formatDate(dateLabel)}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {v.temperature && (
                      <div className="flex items-center gap-2 rounded-xl bg-gold/15 p-3">
                        <ThermometerSun className="h-5 w-5 text-gold" />
                        <div>
                          <p className="text-xs text-muted-foreground">Temp</p>
                          <p className="font-semibold text-ink">{v.temperature}°C</p>
                        </div>
                      </div>
                    )}
                    {v.heart_rate != null && (
                      <div className="flex items-center gap-2 rounded-xl bg-coral-soft p-3">
                        <Heart className="h-5 w-5 text-coral" />
                        <div>
                          <p className="text-xs text-muted-foreground">Heart Rate</p>
                          <p className="font-semibold text-ink">{v.heart_rate} bpm</p>
                        </div>
                      </div>
                    )}
                    {v.oxygen_level != null && (
                      <div className="flex items-center gap-2 rounded-xl bg-teal-soft p-3">
                        <Droplets className="h-5 w-5 text-teal" />
                        <div>
                          <p className="text-xs text-muted-foreground">SpO₂</p>
                          <p className="font-semibold text-ink">{v.oxygen_level}%</p>
                        </div>
                      </div>
                    )}
                    {(v.systolic_bp != null || v.diastolic_bp != null) && (
                      <div className="flex items-center gap-2 rounded-xl bg-lavender-soft p-3">
                        <Activity className="h-5 w-5 text-lavender" />
                        <div>
                          <p className="text-xs text-muted-foreground">BP</p>
                          <p className="font-semibold text-ink">
                            {v.systolic_bp}/{v.diastolic_bp}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-6 text-sm text-muted-foreground">
                    <span>Pain: {v.pain_level}/10</span>
                    <span>Fatigue: {v.fatigue_level}/10</span>
                    <span>Appetite: {v.appetite_level}/10</span>
                  </div>
                  {v.notes && <p className="mt-2 text-sm text-muted-foreground">{v.notes}</p>}
                </div>
              );
            })}
          </div>
        )
      ) : symptoms.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-soft">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-coral-soft">
            <AlertTriangle className="h-8 w-8 text-coral" />
          </span>
          <p className="text-xl text-ink">No symptoms logged yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {symptoms.map((s) => {
            const activeSymptoms = SYMPTOM_FLAGS.filter(
              (f) => s[f.key as keyof SymptomRecord] === true
            ).map((f) => f.label);
            return (
              <div key={s.id} className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[17px] font-bold text-ink">Symptom Log</p>
                  <span className="text-sm text-muted-foreground">{formatDate(s.symptom_date)}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {activeSymptoms.length > 0 ? (
                    activeSymptoms.map((sym) => (
                      <span
                        key={sym}
                        className="rounded-full bg-coral-soft px-3 py-1 text-[13px] font-medium text-coral"
                      >
                        {sym}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No symptoms flagged</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Severity: {s.symptom_severity_score}/10</p>
                {s.notes && <p className="mt-1 text-sm text-muted-foreground">{s.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Vital form modal */}
      {showVitalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div
            ref={vitalDialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="shadow-lift relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-card p-8"
          >
            <button
              onClick={() => setShowVitalForm(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="mb-6 text-3xl">Log Vitals</h2>
            {vFormError && (
              <div className="mb-4 rounded-xl bg-coral-soft px-4 py-3 text-[14px] font-medium text-coral">
                {vFormError}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className={inputClass}
                    placeholder="37.0"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    className={inputClass}
                    placeholder="72"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    Oxygen Level (%)
                  </label>
                  <input
                    type="number"
                    value={oxygenLevel}
                    onChange={(e) => setOxygenLevel(e.target.value)}
                    className={inputClass}
                    placeholder="98"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>
                      Systolic
                    </label>
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className={inputClass}
                      placeholder="120"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Diastolic
                    </label>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className={inputClass}
                      placeholder="80"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>
                    Pain (0–10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painLevel}
                    onChange={(e) => setPainLevel(e.target.value)}
                    className="w-full accent-teal"
                  />
                  <p className="text-center text-sm text-muted-foreground">{painLevel}</p>
                </div>
                <div>
                  <label className={labelClass}>
                    Fatigue (0–10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={fatigueLevel}
                    onChange={(e) => setFatigueLevel(e.target.value)}
                    className="w-full accent-teal"
                  />
                  <p className="text-center text-sm text-muted-foreground">{fatigueLevel}</p>
                </div>
                <div>
                  <label className={labelClass}>
                    Appetite (0–10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={appetiteLevel}
                    onChange={(e) => setAppetiteLevel(e.target.value)}
                    className="w-full accent-teal"
                  />
                  <p className="text-center text-sm text-muted-foreground">{appetiteLevel}</p>
                </div>
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={vitalNotes}
                  onChange={(e) => setVitalNotes(e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <button
                onClick={handleCreateVital}
                disabled={vFormLoading}
                className="w-full rounded-full bg-teal py-3 text-[16px] font-semibold text-white transition-all hover:bg-teal-deep disabled:opacity-50"
              >
                {vFormLoading ? 'Saving…' : 'Save Vitals'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Symptom form modal */}
      {showSymptomForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div
            ref={symptomDialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="shadow-lift relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-card p-8"
          >
            <button
              onClick={() => setShowSymptomForm(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="mb-6 text-3xl">Log Symptoms</h2>
            {sFormError && (
              <div className="mb-4 rounded-xl bg-coral-soft px-4 py-3 text-[14px] font-medium text-coral">
                {sFormError}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {SYMPTOM_FLAGS.map((f) => (
                  <label
                    key={f.key}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={!!symptomFlags[f.key]}
                      onChange={(e) =>
                        setSymptomFlags({ ...symptomFlags, [f.key]: e.target.checked })
                      }
                      className="h-5 w-5 rounded accent-teal"
                    />
                    <span className="text-[15px] text-ink">{f.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className={labelClass}>
                  Severity Score (0–10)
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={severityScore}
                  onChange={(e) => setSeverityScore(e.target.value)}
                  className="w-full accent-teal"
                />
                <p className="text-center text-sm text-muted-foreground">{severityScore}</p>
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <button
                onClick={handleCreateSymptom}
                disabled={sFormLoading}
                className="w-full rounded-full bg-coral py-3 text-[16px] font-semibold text-white transition-all hover:bg-destructive disabled:opacity-50"
              >
                {sFormLoading ? 'Saving…' : 'Save Symptoms'}
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

export default function VitalsPage() {
  return (
    <AuthGuard allowedRoles={['patient', 'caregiver', 'admin']}>
      <AppLayout>
        <VitalsContent />
      </AppLayout>
    </AuthGuard>
  );
}
