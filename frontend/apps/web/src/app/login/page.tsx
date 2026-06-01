'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { login as apiLogin } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth';

const inputClass =
  'w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3.5 text-[16px] text-ink transition-colors focus:border-ring focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/55';

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
    <div className="grain relative flex min-h-screen items-center justify-center overflow-hidden bg-cream p-4">
      <div className="bloom -left-24 -top-24 h-96 w-96 bg-teal-soft" />
      <div className="bloom -bottom-24 right-[-6rem] h-[26rem] w-[26rem]" style={{ background: 'hsl(258 44% 90%)' }} />

      <div className="shadow-lift animate-rise relative w-full max-w-md rounded-[2rem] border border-border bg-card p-8 md:p-10">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-teal-soft">
              <Heart className="h-5 w-5 text-teal" fill="currentColor" />
            </span>
            <span className="font-serif text-2xl font-semibold tracking-tight text-teal-deep">
              Lifeway
              <span className="ml-1 align-middle font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-lavender">
                Care
              </span>
            </span>
          </Link>
          <h1 className="mb-2 text-3xl">Welcome Back</h1>
          <p className="text-[16px] text-muted-foreground">Sign in to continue to your dashboard</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-[15px] font-semibold text-ink">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              inputMode="email"
              className={inputClass}
              placeholder="you@example.in"
            />
          </div>

          <div>
            <label className="mb-2 block text-[15px] font-semibold text-ink">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={`${inputClass} pr-12`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-ink"
              >
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-teal py-3.5 text-[17px] font-semibold text-white shadow-soft transition-all hover:bg-teal-deep hover:shadow-lift disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-[15px] text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-teal hover:underline">
            Create one
          </Link>
        </p>

        {/* Demo accounts hint */}
        <div className="mt-6 rounded-2xl border border-border bg-muted/50 p-4">
          <p className="mb-2 text-[13px] font-medium text-muted-foreground">Demo Accounts (Password123!)</p>
          <div className="space-y-1 text-[13px] text-muted-foreground">
            <p>patient@example.com · admin@example.com · caregiver@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
