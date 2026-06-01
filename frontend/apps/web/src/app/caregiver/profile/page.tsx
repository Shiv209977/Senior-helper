'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { User, Save } from 'lucide-react';
import { listCaregiverProfiles, updateCaregiverProfile } from '@/lib/api/profiles';
import { useAuthStore } from '@/lib/store/auth';
import type { CaregiverProfile } from '@/lib/api/types';
import { toast } from 'sonner';
import { PageHeader, Spinner } from '@/components/ui-kit';

const inputClass =
  'w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3 text-[16px] text-ink transition-colors focus:border-ring focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/55';
const labelClass = 'mb-1 block text-[14px] font-semibold text-ink';

function CaregiverProfileContent() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<CaregiverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
    setSaving(true);
    try {
      await updateCaregiverProfile(profile.id, {
        relationship_to_patient: relationship,
        phone,
        address,
        availability_notes: availability,
      });
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
        subtitle="Your details and availability"
        accent="teal"
      />
      {error && (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
          {error}
        </div>
      )}

      <div className="animate-rise space-y-6 rounded-[1.5rem] border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="border-b border-border pb-4">
          <p className="text-[13px] text-muted-foreground">Full Name</p>
          <p className="text-[16px] font-semibold text-ink">
            {profile?.full_name ?? user?.full_name}
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">Email</p>
          <p className="text-ink">{profile?.email ?? user?.email}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Relationship to Patient
            </label>
            <input
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
        <div>
          <label className={labelClass}>
            Availability Notes
          </label>
          <textarea
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
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
