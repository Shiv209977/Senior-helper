'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { User, Save } from 'lucide-react';
import { listPatientProfiles, updatePatientProfile } from '@/lib/api/profiles';
import { useAuthStore } from '@/lib/store/auth';
import type { PatientProfile } from '@/lib/api/types';

const inputClass =
  'w-full rounded-xl border border-border bg-card px-4 py-3 text-[16px] text-ink transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/55';
const labelClass = 'mb-1 block text-[14px] font-semibold text-ink';

function ProfileContent() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setSuccess('');
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
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div
          className="h-11 w-11 rounded-full border-4 border-teal-soft border-t-teal"
          style={{ animation: 'spin 0.9s linear infinite' }}
        />
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

  return (
    <div>
      <div className="animate-rise mb-8">
        <h1 className="flex items-center gap-3 text-4xl">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-soft">
            <User className="h-6 w-6 text-teal" />
          </span>
          My Profile
        </h1>
        <p className="mt-2 text-xl text-muted-foreground">Manage your personal and medical information</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-2xl border border-teal/20 bg-teal-soft px-5 py-4 text-[15px] font-medium text-teal-deep">
          {success}
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
