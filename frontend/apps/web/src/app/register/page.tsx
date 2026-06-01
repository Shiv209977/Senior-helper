'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { register as apiRegister } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth';

const inputClass =
  'w-full rounded-xl border border-border bg-card px-4 py-3.5 text-[16px] text-ink transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/55';

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
          <h1 className="mb-2 text-3xl">Create Your Account</h1>
          <p className="text-[16px] text-muted-foreground">Start your care journey today</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-coral/20 bg-coral-soft px-5 py-4 text-[15px] font-medium text-coral">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role selector */}
          <div>
            <label className="mb-2 block text-[15px] font-semibold text-ink">I am a…</label>
            <div className="grid grid-cols-2 gap-3">
              {(['patient', 'caregiver'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-xl border-2 px-4 py-3 text-[16px] font-semibold capitalize transition-colors ${
                    role === r
                      ? 'border-teal bg-teal-soft text-teal-deep'
                      : 'border-border bg-card text-muted-foreground hover:border-teal/40'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[15px] font-semibold text-ink">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              className={inputClass}
              placeholder="Aarav Sharma"
            />
          </div>

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
            <label className="mb-2 block text-[15px] font-semibold text-ink">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              inputMode="tel"
              className={inputClass}
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="mb-2 block text-[15px] font-semibold text-ink">
              Password <span className="font-normal text-muted-foreground">(min 8 characters)</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
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
            {loading ? 'Creating account…' : 'Get Started'}
          </button>
        </form>

        <p className="mt-8 text-center text-[15px] text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-teal hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
