'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { User, Save } from 'lucide-react';
import { listPatientProfiles, updatePatientProfile } from '@/lib/api/profiles';
import { useAuthStore } from '@/lib/store/auth';
import type { PatientProfile } from '@/lib/api/types';

const TEAL = '#1B7A6E';

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
          className="w-10 h-10 border-4 border-t-transparent rounded-full"
          style={{
            borderColor: TEAL,
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite',
          }}
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <User className="w-8 h-8" style={{ color: TEAL }} /> My Profile
        </h1>
        <p className="text-gray-500 text-lg mt-1">Manage your personal and medical information</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[15px]">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-[15px]">
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
        {/* Read-only */}
        <div className="mb-8 pb-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Account</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-400 mb-1">Full Name</label>
              <p className="text-[16px] text-gray-800 font-semibold">
                {profile?.full_name ?? user?.full_name}
              </p>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-400 mb-1">Email</label>
              <p className="text-[16px] text-gray-800">{profile?.email ?? user?.email}</p>
            </div>
          </div>
        </div>

        {/* Editable */}
        <div className="space-y-6">
          <h2 className="font-bold text-gray-900 text-lg">Personal Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-1">Gender</label>
              <input
                type="text"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
            />
          </div>

          <h2 className="font-bold text-gray-900 text-lg pt-4">Emergency Contact</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={ecName}
                onChange={(e) => setEcName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={ecPhone}
                onChange={(e) => setEcPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          <h2 className="font-bold text-gray-900 text-lg pt-4">Medical Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                Cancer Type
              </label>
              <input
                type="text"
                value={cancerType}
                onChange={(e) => setCancerType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                Treatment Stage
              </label>
              <input
                type="text"
                value={treatmentStage}
                onChange={(e) => setTreatmentStage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                Primary Hospital
              </label>
              <input
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-1">
                Doctor Name
              </label>
              <input
                type="text"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-[16px] hover:opacity-90 disabled:opacity-50 transition"
            style={{ backgroundColor: TEAL }}
          >
            <Save className="w-5 h-5" /> {saving ? 'Saving…' : 'Save Changes'}
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
