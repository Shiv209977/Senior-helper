'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { register as apiRegister } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth';

const TEAL = '#1B7A6E';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'caregiver'>('patient');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiRegister({
        email,
        password,
        full_name: fullName,
        phone,
        role,
      });
      setUser(data.user);
      const dest = role === 'caregiver' ? '/caregiver' : '/patient/today';
      router.push(dest);
    } catch (err: any) {
      setError(err.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#FDF8F4' }}
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 md:p-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Heart className="w-9 h-9" style={{ color: TEAL }} fill={TEAL} />
            <span className="text-2xl font-bold" style={{ color: TEAL }}>
              Lifeway
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-500 text-[16px]">Start your care journey today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[15px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role selector */}
          <div>
            <label className="block text-[15px] font-semibold text-gray-700 mb-2">I am a…</label>
            <div className="grid grid-cols-2 gap-3">
              {(['patient', 'caregiver'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="px-4 py-3 rounded-xl border-2 text-[16px] font-semibold capitalize transition"
                  style={{
                    borderColor: role === r ? TEAL : '#E5E7EB',
                    backgroundColor: role === r ? '#E8F5F2' : 'white',
                    color: role === r ? TEAL : '#6B7280',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[15px] font-semibold text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2 focus:border-transparent"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-[15px] font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-[15px] font-semibold text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-[15px] font-semibold text-gray-700 mb-2">
              Password <span className="font-normal text-gray-400">(min 8 characters)</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2 focus:border-transparent pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white text-[17px] font-semibold transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: TEAL }}
          >
            {loading ? 'Creating account…' : 'Get Started'}
          </button>
        </form>

        <p className="text-center mt-8 text-[15px] text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: TEAL }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
