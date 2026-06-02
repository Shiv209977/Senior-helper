'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Activity,
  Pill,
  CalendarCheck,
  Users,
  Phone,
  ChevronRight,
  ShieldCheck,
  Smile,
  HeartHandshake,
  Star,
  Mail,
  MapPin,
  Heart,
  Menu,
  X,
  Check,
} from 'lucide-react';

/* ─── Decorative botanical sprig (watercolor-ish, inline SVG) ─────── */
function Sprig({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 200" fill="none" className={className} aria-hidden>
      <path d="M60 200V40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} opacity={0.5 - i * 0.06}>
          <path
            d={`M60 ${150 - i * 34}c-18-6-34-2-44 12 14 8 32 6 44-12z`}
            fill="currentColor"
          />
          <path
            d={`M60 ${134 - i * 34}c18-6 34-2 44 12-14 8-32 6-44-12z`}
            fill="currentColor"
          />
        </g>
      ))}
      <circle cx="60" cy="34" r="9" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '#features' },
    { label: 'Trust', href: '#trust' },
    { label: 'Stories', href: '#testimonials' },
    { label: 'Contact', href: '#contact' },
  ];
  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-teal-soft">
            <Heart className="h-5 w-5 text-teal" fill="currentColor" />
          </span>
          <span className="font-serif text-2xl font-semibold tracking-tight text-teal-deep">
            Lifeway
            <span className="ml-1 align-middle text-[11px] font-sans font-semibold uppercase tracking-[0.18em] text-lavender">
              Care
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-9 text-[16px] font-medium text-muted-foreground md:flex">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="transition-colors hover:text-teal-deep">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <a href="tel:18001231234" className="flex items-center gap-1.5 text-[15px] font-semibold text-teal-deep">
            <Phone className="h-4 w-4" /> 1800 123 1234
          </a>
          <Link
            href="/login"
            className="rounded-full border-2 border-teal px-5 py-2 text-[15px] font-semibold text-teal transition-colors hover:bg-teal-soft"
          >
            Sign In
          </Link>
        </div>

        <button className="p-2 text-ink md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="space-y-1 border-t border-border bg-cream px-5 pb-5 pt-2 md:hidden">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="block py-2.5 text-[17px] text-ink"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="mt-2 block rounded-full bg-teal py-3 text-center font-semibold text-white"
            onClick={() => setOpen(false)}
          >
            Sign In
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="grain relative overflow-hidden bg-cream">
      <div className="bloom -left-24 -top-24 h-96 w-96 bg-teal-soft" />
      <div className="bloom right-[-10%] top-1/3 h-[28rem] w-[28rem]" style={{ background: 'hsl(258 44% 90%)' }} />
      <Sprig className="absolute -left-2 top-24 hidden h-72 w-44 text-sage lg:block" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <div className="max-w-2xl">
          <span className="animate-rise inline-flex items-center gap-2 rounded-full bg-lavender-soft px-4 py-1.5 text-[13px] font-semibold uppercase tracking-[0.16em] text-lavender-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-lavender" /> Cancer Care Support
          </span>
          <h1
            className="animate-rise mt-6 text-[2.75rem] leading-[1.04] sm:text-6xl"
            style={{ animationDelay: '0.05s' }}
          >
            Navigate cancer care with{' '}
            <span className="text-teal">confidence</span> and{' '}
            <em className="font-normal not-italic text-lavender">comfort.</em>
          </h1>
          <p
            className="animate-rise mt-6 max-w-xl text-xl leading-relaxed text-muted-foreground"
            style={{ animationDelay: '0.12s' }}
          >
            Compassionate support. Personalized care. Track medications, log symptoms, manage
            appointments, and stay close to your care team — every step of the way.
          </p>
          <div className="animate-rise mt-9 flex flex-wrap gap-4" style={{ animationDelay: '0.2s' }}>
            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 rounded-full bg-teal px-8 py-4 text-lg font-semibold text-white shadow-soft transition-all hover:bg-teal-deep hover:shadow-lift"
            >
              <Heart className="h-5 w-5" fill="currentColor" /> Get Started
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="tel:18001231234"
              className="inline-flex items-center gap-2.5 rounded-full border-2 border-teal bg-white/60 px-8 py-4 text-lg font-semibold text-teal transition-colors hover:bg-teal-soft"
            >
              <Phone className="h-5 w-5" /> Talk to a Care Guide
            </a>
          </div>
        </div>

        {/* Crafted visual panel */}
        <div className="animate-rise relative" style={{ animationDelay: '0.15s' }}>
          <div
            className="shadow-lift relative aspect-[4/5] overflow-hidden rounded-[2rem]"
            style={{
              backgroundImage:
                'linear-gradient(135deg, hsl(171 64% 29%) 0%, hsl(172 70% 22%) 55%, hsl(200 40% 20%) 100%)',
            }}
          >
            {/* abstract care illustration */}
            <div className="absolute inset-0 opacity-90">
              <div className="bloom left-6 top-10 h-40 w-40" style={{ background: 'hsl(38 78% 70%)', opacity: 0.35 }} />
              <div className="bloom bottom-8 right-4 h-52 w-52" style={{ background: 'hsl(258 44% 78%)', opacity: 0.4 }} />
            </div>
            <Sprig className="absolute -right-4 bottom-0 h-80 w-52 text-white/20" />
            <div className="absolute inset-0 grid place-items-center">
              <HeartHandshake className="h-40 w-40 text-white/90" strokeWidth={1.1} />
            </div>
            <p className="absolute bottom-7 left-7 right-7 font-serif text-2xl leading-snug text-white/95">
              “Together, every step of the way.”
            </p>
          </div>

          {/* Floating: next appointment chip */}
          <div className="animate-floaty shadow-lift absolute -left-5 top-10 hidden w-56 rounded-2xl bg-card p-4 sm:block">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-soft">
                <CalendarCheck className="h-5 w-5 text-teal" />
              </span>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Next appointment
                </p>
                <p className="font-serif text-lg text-ink">May 23 · 10:30 AM</p>
              </div>
            </div>
          </div>

          {/* Floating: you're not alone */}
          <div className="shadow-lift absolute -bottom-6 right-2 w-60 rounded-2xl bg-card p-5 sm:right-[-1rem]">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-lavender-soft">
              <Users className="h-5 w-5 text-lavender" />
            </span>
            <p className="mt-3 font-serif text-xl text-ink">You&apos;re not alone.</p>
            <p className="mt-1 text-[15px] text-muted-foreground">
              Our care team and community are here for you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Feature Cards ──────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Activity,
    title: 'AI Symptom & Vitals Check',
    description: 'Log how you feel and get personalized, AI-assisted insights with clear next steps.',
    cta: 'Start Check',
    fg: 'text-teal',
    tile: 'bg-teal-soft',
    btn: 'bg-teal text-white hover:bg-teal-deep',
  },
  {
    icon: Pill,
    title: 'Medication Reminders',
    description: 'Stay on track with simple schedules, one-tap logging, and missed-dose alerts.',
    cta: 'View Medications',
    fg: 'text-coral',
    tile: 'bg-coral-soft',
    btn: 'bg-coral text-white hover:opacity-90',
  },
  {
    icon: CalendarCheck,
    title: 'Upcoming Appointments',
    description: 'See every consultation, treatment, and lab test in one clear, readable place.',
    cta: 'View Appointments',
    fg: 'text-ink',
    tile: 'bg-muted',
    btn: 'bg-ink/90 text-white hover:bg-ink',
  },
  {
    icon: Users,
    title: 'Caregiver Support',
    description: 'Invite family with a simple code so they can monitor and respond when it counts.',
    cta: 'Explore Support',
    fg: 'text-lavender-deep',
    tile: 'bg-lavender-soft',
    btn: 'bg-lavender text-white hover:bg-lavender-deep',
  },
];

function FeatureCards() {
  return (
    <section id="features" className="relative bg-background py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-teal">What we offer</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">Everything you need, in one calm place</h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Built with care for patients and the families walking beside them.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="animate-rise group flex flex-col rounded-2xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <span className={`grid h-14 w-14 place-items-center rounded-2xl ${f.tile}`}>
                  <Icon className={`h-7 w-7 ${f.fg}`} />
                </span>
                <h3 className={`mt-5 text-[1.35rem] ${f.fg}`}>{f.title}</h3>
                <p className="mt-2.5 flex-1 text-[16px] leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
                <Link
                  href="/register"
                  className={`mt-6 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-all ${f.btn}`}
                >
                  {f.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Trust Strip ────────────────────────────────────────────────── */
const TRUST = [
  { icon: Smile, label: 'Easy to Use', copy: 'Designed for seniors with clear steps and large text.' },
  { icon: ShieldCheck, label: 'Secure & Private', copy: 'Your health information is encrypted and protected.' },
  { icon: HeartHandshake, label: 'Compassionate Guidance', copy: 'Real people and smart technology, caring for you.' },
  { icon: Star, label: 'Trusted by Families', copy: 'Join thousands who trust Lifeway every day.' },
];

function TrustStrip() {
  return (
    <section id="trust" className="relative overflow-hidden bg-teal-soft">
      <Sprig className="absolute -right-4 -top-6 h-64 w-40 rotate-12 text-sage/70" />
      <div className="relative mx-auto grid max-w-7xl gap-x-8 gap-y-10 px-5 py-16 sm:px-8 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="flex gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white shadow-soft">
                <Icon className="h-6 w-6 text-teal" />
              </span>
              <div>
                <p className="font-serif text-xl text-ink">{t.label}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{t.copy}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Testimonial + CTA ──────────────────────────────────────────── */
function Testimonial() {
  return (
    <section id="testimonials" className="bg-lavender-soft py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative max-w-2xl">
          <span className="font-serif text-[7rem] leading-[0.6] text-lavender/40">“</span>
          <blockquote className="-mt-10 font-serif text-3xl italic leading-snug text-ink sm:text-[2.5rem]">
            Lifeway has been a true blessing. The support, guidance, and reminders help me focus on
            healing and living each day.
          </blockquote>
          <div className="mt-7 flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-lavender text-lg font-semibold text-white">
              M
            </span>
            <div>
              <p className="font-semibold text-ink">Lakshmi Iyer</p>
              <div className="mt-0.5 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="shadow-lift rounded-[2rem] bg-card p-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-coral-soft">
            <Heart className="h-8 w-8 text-coral" fill="currentColor" />
          </span>
          <h3 className="mt-5 text-3xl">Hope. Support. Together.</h3>
          <p className="mx-auto mt-3 max-w-sm text-lg leading-relaxed text-muted-foreground">
            We&apos;re here for you — today, tomorrow, and every step forward.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-teal px-8 py-4 text-lg font-semibold text-white shadow-soft transition-all hover:bg-teal-deep hover:shadow-lift"
          >
            Learn More About Us <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────── */
function Footer() {
  const cols = [
    { h: 'Quick Links', items: ['Care Plans', 'Appointments', 'Symptom Check', 'Resources', 'Support'] },
    { h: 'Support', items: ['Talk to a Care Guide', 'Caregiver Support', 'Community Forum', 'FAQs'] },
  ];
  return (
    <footer id="contact" className="border-t border-border bg-cream pb-10 pt-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-teal-soft">
              <Heart className="h-5 w-5 text-teal" fill="currentColor" />
            </span>
            <span className="font-serif text-2xl font-semibold text-teal-deep">Lifeway</span>
          </div>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
            Compassionate support and personalized care for every step of your cancer journey.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-teal-soft px-4 py-2 text-[13px] font-semibold text-teal-deep">
            <ShieldCheck className="h-4 w-4" /> HIPAA Compliant
          </div>
        </div>

        {cols.map((c) => (
          <div key={c.h}>
            <h4 className="font-serif text-xl text-ink">{c.h}</h4>
            <ul className="mt-4 space-y-2.5 text-[15px] text-muted-foreground">
              {c.items.map((it) => (
                <li key={it}>
                  <Link href="/register" className="transition-colors hover:text-teal-deep">
                    {it}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="font-serif text-xl text-ink">Contact Us</h4>
          <ul className="mt-4 space-y-3 text-[15px] text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-teal" /> 1234567890
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-teal" /> care@lifeway.in
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> 12 Roads, Bengaluru, Karnataka 5600255
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="h-4 w-4 shrink-0 text-teal" /> Mon–Sat 8AM–8PM IST · Sun 9AM–5PM IST
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-border px-5 pt-6 text-center text-sm text-muted-foreground sm:px-8">
        © 2026 Lifeway Cancer Support. All rights reserved. · Privacy Policy · Terms of Use · Accessibility
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <Hero />
      <FeatureCards />
      <TrustStrip />
      <Testimonial />
      <Footer />
    </div>
  );
}
