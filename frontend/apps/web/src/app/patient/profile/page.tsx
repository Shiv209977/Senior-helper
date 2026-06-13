'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { User, Save, Zap } from 'lucide-react';
import { listPatientProfiles, updatePatientProfile } from '@/lib/api/profiles';
import { apiFetch } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';
import type { PatientProfile } from '@/lib/api/types';
import { toast } from 'sonner';
import { PageHeader, Spinner, Toggle } from '@/components/ui-kit';

const inputClass =
  'w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3 text-[16px] text-ink transition-colors focus:border-ring focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/55';
const labelClass = 'mb-1 block text-[14px] font-semibold text-ink';

function ProfileContent() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [fastMode, setFastMode] = useState<boolean>(true);
  const [fastModeToggling, setFastModeToggling] = useState(false);

  useEffect(() => {
    if (user) setFastMode(user.fast_mode ?? true);
  }, [user?.fast_mode]);

  const handleFastModeToggle = async () => {
    setFastModeToggling(true);
    try {
      const updated = await apiFetch<{ fast_mode: boolean }>('/auth/me/', {
        method: 'PATCH',
        body: JSON.stringify({ fast_mode: !fastMode }),
      });
      setFastMode(updated.fast_mode);
      toast.success(updated.fast_mode ? 'Fast Mode ON — using quick keyword detection' : 'Fast Mode OFF — AI reads your notes');
    } catch {
      toast.error('Could not update preference');
    } finally {
      setFastModeToggling(false);
    }
  };

  // Editable fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [ecName, setEcName] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [cancerType, setCancerType] = useState('');
  const [treatmentStage, setTreatmentStage] = useState('');
  const [hospital, setHospital] = useState('');
  const [doctor, setDoctor] = useState('');
  const [notes, setNotes] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const profiles = await listPatientProfiles();
      const mine = profiles.find((p) => p.user === user?.id) ?? profiles[0] ?? null;
      if (mine) {
        setProfile(mine);
        setAge(mine.age?.toString() ?? '');
        setGender(mine.gender ?? '');
        setAddress(mine.address ?? '');
        setEcName(mine.emergency_contact_name ?? '');
        setEcPhone(mine.emergency_contact_phone ?? '');
        setCancerType(mine.cancer_type ?? '');
        setTreatmentStage(mine.treatment_stage ?? '');
        setHospital(mine.primary_hospital ?? '');
        setDoctor(mine.doctor_name ?? '');
        setNotes(mine.notes ?? '');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user, fetchProfile]);

  const handleSave = async () => {
    if (!profile) return;
    setError('');
    setSaving(true);
    try {
      const updated = await updatePatientProfile(profile.id, {
        age: age ? parseInt(age) : null,
        gender,
        address,
        emergency_contact_name: ecName,
        emergency_contact_phone: ecPhone,
        cancer_type: cancerType,
        treatment_stage: treatmentStage,
        primary_hospital: hospital,
        doctor_name: doctor,
        notes,
      });
      setProfile(updated);
      toast.success('Profile updated');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <PageHeader
        icon={<User className="h-6 w-6" />}
        title="My Profile"
        subtitle="Manage your personal and medical information"
        accent="teal"
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
          {error}
        </div>
      )}

      <div className="animate-rise rounded-[1.5rem] border border-border bg-card p-6 shadow-soft md:p-8" style={{ animationDelay: '0.06s' }}>
        {/* Read-only */}
        <div className="mb-8 border-b border-border pb-6">
          <h2 className="mb-4 font-serif text-xl text-ink">Account</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[13px] font-medium text-muted-foreground">Full Name</label>
              <p className="text-[16px] font-semibold text-ink">
                {profile?.full_name ?? user?.full_name}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-muted-foreground">Email</label>
              <p className="text-[16px] text-ink">{profile?.email ?? user?.email}</p>
            </div>
          </div>
        </div>

        {/* Editable */}
        <div className="space-y-6">
          <h2 className="font-serif text-xl text-ink">Personal Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <input
                type="text"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
            />
          </div>

          <h2 className="pt-4 font-serif text-xl text-ink">Emergency Contact</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Contact Name
              </label>
              <input
                type="text"
                value={ecName}
                onChange={(e) => setEcName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Contact Phone
              </label>
              <input
                type="tel"
                value={ecPhone}
                onChange={(e) => setEcPhone(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <h2 className="pt-4 font-serif text-xl text-ink">Medical Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Cancer Type
              </label>
              <input
                type="text"
                value={cancerType}
                onChange={(e) => setCancerType(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Treatment Stage
              </label>
              <input
                type="text"
                value={treatmentStage}
                onChange={(e) => setTreatmentStage(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Primary Hospital
              </label>
              <input
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Doctor Name
              </label>
              <input
                type="text"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-[16px] font-semibold text-white shadow-soft transition-all hover:bg-teal-deep hover:shadow-lift disabled:opacity-50"
          >
            <Save className="h-5 w-5" /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Fast Mode preference */}
      <div className="animate-rise mt-6 rounded-[1.5rem] border border-border bg-card p-6 shadow-soft md:p-8" style={{ animationDelay: '0.12s' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-gold/20">
              <Zap className="h-5 w-5 text-gold" />
            </span>
            <div>
              <p className="text-[16px] font-semibold text-ink">Fast Mode</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                {fastMode
                  ? 'ON — Your notes are checked instantly using smart keyword detection.'
                  : 'OFF — Your notes are read by AI for deeper understanding. Takes a few extra seconds.'}
              </p>
            </div>
          </div>
          <Toggle
            checked={fastMode}
            onChange={handleFastModeToggle}
            disabled={fastModeToggling}
            color="gold"
            label="Fast Mode"
          />
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

export default function ProfilePage() {
  return (
    <AuthGuard allowedRoles={['patient']}>
      <AppLayout>
        <ProfileContent />
      </AppLayout>
    </AuthGuard>
  );
}
