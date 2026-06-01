'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { login as apiLogin } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth';

const TEAL = '#1B7A6E';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin({ email, password });
      setUser(data.user);
      const dest =
        data.user.role === 'admin'
          ? '/admin'
          : data.user.role === 'caregiver'
            ? '/caregiver'
            : '/patient/today';
      router.push(dest);
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-[16px]">Sign in to continue to your dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[15px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[15px] font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ focusRingColor: TEAL } as any}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-[15px] font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-8 text-[15px] text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: TEAL }}>
            Create one
          </Link>
        </p>

        {/* Demo accounts hint */}
        <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[13px] text-gray-400 font-medium mb-2">Demo Accounts (Password123!)</p>
          <div className="space-y-1 text-[13px] text-gray-400">
            <p>patient@example.com · admin@example.com · caregiver@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
