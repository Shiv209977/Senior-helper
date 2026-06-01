'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { Activity, Plus, X, ThermometerSun, Heart, Droplets, AlertTriangle } from 'lucide-react';
import { listVitals, createVital } from '@/lib/api/vitals';
import { listSymptoms, createSymptom } from '@/lib/api/symptoms';
import type { VitalSign, SymptomRecord } from '@/lib/api/types';

const TEAL = '#1B7A6E';
const CORAL = '#D4686A';

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
      fetchAll();
    } catch (err: any) {
      setSFormError(err.message);
    } finally {
      setSFormLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8" style={{ color: TEAL }} /> Vitals & Symptoms
          </h1>
          <p className="text-gray-500 text-lg mt-1">Track your health data</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowVitalForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-[15px] hover:opacity-90 transition"
            style={{ backgroundColor: TEAL }}
          >
            <Plus className="w-4 h-4" /> Log Vitals
          </button>
          <button
            onClick={() => setShowSymptomForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-[15px] hover:opacity-90 transition"
            style={{ backgroundColor: CORAL }}
          >
            <Plus className="w-4 h-4" /> Log Symptoms
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[15px]">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['vitals', 'symptoms'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2.5 rounded-xl font-semibold text-[15px] capitalize transition"
            style={{
              backgroundColor: tab === t ? '#E8F5F2' : '#F3F4F6',
              color: tab === t ? TEAL : '#6B7280',
            }}
          >
            {t}
          </button>
        ))}
      </div>

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
      ) : tab === 'vitals' ? (
        vitals.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl text-gray-400">No vitals logged yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vitals.map((v) => {
              const dateLabel = v.recorded_at.split('T')[0] ?? '';
              return (
                <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-gray-800 text-[17px]">Vitals Record</p>
                    <span className="text-sm text-gray-400">{dateLabel}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {v.temperature && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50">
                        <ThermometerSun className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="text-xs text-gray-400">Temp</p>
                          <p className="font-semibold text-gray-800">{v.temperature}°C</p>
                        </div>
                      </div>
                    )}
                    {v.heart_rate != null && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50">
                        <Heart className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-xs text-gray-400">Heart Rate</p>
                          <p className="font-semibold text-gray-800">{v.heart_rate} bpm</p>
                        </div>
                      </div>
                    )}
                    {v.oxygen_level != null && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50">
                        <Droplets className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-400">SpO₂</p>
                          <p className="font-semibold text-gray-800">{v.oxygen_level}%</p>
                        </div>
                      </div>
                    )}
                    {(v.systolic_bp != null || v.diastolic_bp != null) && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50">
                        <Activity className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="text-xs text-gray-400">BP</p>
                          <p className="font-semibold text-gray-800">
                            {v.systolic_bp}/{v.diastolic_bp}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-6 mt-3 text-sm text-gray-500">
                    <span>Pain: {v.pain_level}/10</span>
                    <span>Fatigue: {v.fatigue_level}/10</span>
                    <span>Appetite: {v.appetite_level}/10</span>
                  </div>
                  {v.notes && <p className="text-sm text-gray-400 mt-2">{v.notes}</p>}
                </div>
              );
            })}
          </div>
        )
      ) : symptoms.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-xl text-gray-400">No symptoms logged yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {symptoms.map((s) => {
            const activeSymptoms = SYMPTOM_FLAGS.filter(
              (f) => s[f.key as keyof SymptomRecord] === true
            ).map((f) => f.label);
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-gray-800 text-[17px]">Symptom Log</p>
                  <span className="text-sm text-gray-400">{s.symptom_date}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {activeSymptoms.length > 0 ? (
                    activeSymptoms.map((sym) => (
                      <span
                        key={sym}
                        className="px-3 py-1 rounded-full text-[13px] font-medium bg-red-50 text-red-600"
                      >
                        {sym}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">No symptoms flagged</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">Severity: {s.symptom_severity_score}/10</p>
                {s.notes && <p className="text-sm text-gray-400 mt-1">{s.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Vital form modal */}
      {showVitalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowVitalForm(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Log Vitals</h2>
            {vFormError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-[14px]">
                {vFormError}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                    placeholder="37.0"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                    placeholder="72"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                    Oxygen Level (%)
                  </label>
                  <input
                    type="number"
                    value={oxygenLevel}
                    onChange={(e) => setOxygenLevel(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                    placeholder="98"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                      Systolic
                    </label>
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                      placeholder="120"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                      Diastolic
                    </label>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
                      placeholder="80"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                    Pain (0–10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painLevel}
                    onChange={(e) => setPainLevel(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-center text-sm text-gray-500">{painLevel}</p>
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                    Fatigue (0–10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={fatigueLevel}
                    onChange={(e) => setFatigueLevel(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-center text-sm text-gray-500">{fatigueLevel}</p>
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                    Appetite (0–10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={appetiteLevel}
                    onChange={(e) => setAppetiteLevel(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-center text-sm text-gray-500">{appetiteLevel}</p>
                </div>
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  value={vitalNotes}
                  onChange={(e) => setVitalNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2 resize-none"
                />
              </div>
              <button
                onClick={handleCreateVital}
                disabled={vFormLoading}
                className="w-full py-3 rounded-xl text-white font-semibold text-[16px] hover:opacity-90 disabled:opacity-50 transition"
                style={{ backgroundColor: TEAL }}
              >
                {vFormLoading ? 'Saving…' : 'Save Vitals'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Symptom form modal */}
      {showSymptomForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowSymptomForm(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Log Symptoms</h2>
            {sFormError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-[14px]">
                {sFormError}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {SYMPTOM_FLAGS.map((f) => (
                  <label
                    key={f.key}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition"
                  >
                    <input
                      type="checkbox"
                      checked={!!symptomFlags[f.key]}
                      onChange={(e) =>
                        setSymptomFlags({ ...symptomFlags, [f.key]: e.target.checked })
                      }
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-[15px] text-gray-700">{f.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                  Severity Score (0–10)
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={severityScore}
                  onChange={(e) => setSeverityScore(e.target.value)}
                  className="w-full"
                />
                <p className="text-center text-sm text-gray-500">{severityScore}</p>
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  value={symptomNotes}
                  onChange={(e) => setSymptomNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2 resize-none"
                />
              </div>
              <button
                onClick={handleCreateSymptom}
                disabled={sFormLoading}
                className="w-full py-3 rounded-xl text-white font-semibold text-[16px] hover:opacity-90 disabled:opacity-50 transition"
                style={{ backgroundColor: CORAL }}
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
