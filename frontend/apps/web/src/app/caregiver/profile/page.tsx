'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { User, Save } from 'lucide-react';
import { listCaregiverProfiles, updateCaregiverProfile } from '@/lib/api/profiles';
import { useAuthStore } from '@/lib/store/auth';
import type { CaregiverProfile } from '@/lib/api/types';

const TEAL = '#1B7A6E';

function CaregiverProfileContent() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<CaregiverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [availability, setAvailability] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCaregiverProfiles(1);
      const mine = res.results.find((p) => p.user === user?.id) ?? res.results[0] ?? null;
      if (mine) {
        setProfile(mine);
        setRelationship(mine.relationship_to_patient ?? '');
        setPhone(mine.phone ?? '');
        setAddress(mine.address ?? '');
        setAvailability(mine.availability_notes ?? '');
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
      await updateCaregiverProfile(profile.id, {
        relationship_to_patient: relationship,
        phone,
        address,
        availability_notes: availability,
      });
      setSuccess('Profile updated!');
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
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-8">
        <User className="w-8 h-8" style={{ color: TEAL }} /> My Profile
      </h1>
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

      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 space-y-6">
        <div className="pb-4 border-b border-gray-100">
          <p className="text-[13px] text-gray-400">Full Name</p>
          <p className="font-semibold text-gray-800 text-[16px]">
            {profile?.full_name ?? user?.full_name}
          </p>
          <p className="text-[13px] text-gray-400 mt-2">Email</p>
          <p className="text-gray-800">{profile?.email ?? user?.email}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[14px] font-semibold text-gray-700 mb-1">
              Relationship to Patient
            </label>
            <input
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2"
            />
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
        <div>
          <label className="block text-[14px] font-semibold text-gray-700 mb-1">
            Availability Notes
          </label>
          <textarea
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
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
  );
}

export default function CaregiverProfilePage() {
  return (
    <AuthGuard allowedRoles={['caregiver']}>
      <AppLayout>
        <CaregiverProfileContent />
      </AppLayout>
    </AuthGuard>
  );
}
