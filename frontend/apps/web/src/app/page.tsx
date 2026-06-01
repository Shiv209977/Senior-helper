'use client';

import Link from 'next/link';
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
  Clock,
  Heart,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

/* ─── colour tokens ──────────────────────────────────────────────── */
const TEAL = '#1B7A6E';
const TEAL_LIGHT = '#E8F5F2';
const LAVENDER = '#7B68AE';
const LAVENDER_BG = '#F3EFF8';
const CREAM = '#FDF8F4';
const CORAL = '#D4686A';

/* ─── Navbar ─────────────────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[72px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Heart className="w-8 h-8" style={{ color: TEAL }} fill={TEAL} />
          <span className="text-xl font-bold" style={{ color: TEAL }}>
            Lifeway
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 text-[17px] font-medium text-gray-600">
          <Link href="/" className="hover:text-gray-900 transition">
            Home
          </Link>
          <Link href="#features" className="hover:text-gray-900 transition">
            Features
          </Link>
          <Link href="#testimonials" className="hover:text-gray-900 transition">
            Testimonials
          </Link>
          <Link href="#contact" className="hover:text-gray-900 transition">
            Contact
          </Link>
        </div>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="tel:+18001234567"
            className="flex items-center gap-1.5 text-gray-500 text-[15px] hover:text-gray-700 transition"
          >
            <Phone className="w-4 h-4" />
            1-800-123-4567
          </a>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl text-[16px] font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: TEAL }}
          >
            Sign In
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 space-y-3">
          <Link
            href="/"
            className="block py-2 text-[17px] text-gray-700"
            onClick={() => setOpen(false)}
          >
            Home
          </Link>
          <Link
            href="#features"
            className="block py-2 text-[17px] text-gray-700"
            onClick={() => setOpen(false)}
          >
            Features
          </Link>
          <Link
            href="#testimonials"
            className="block py-2 text-[17px] text-gray-700"
            onClick={() => setOpen(false)}
          >
            Testimonials
          </Link>
          <Link
            href="#contact"
            className="block py-2 text-[17px] text-gray-700"
            onClick={() => setOpen(false)}
          >
            Contact
          </Link>
          <Link
            href="/login"
            className="block text-center py-3 rounded-xl text-white font-semibold"
            style={{ backgroundColor: TEAL }}
            onClick={() => setOpen(false)}
          >
            Sign In
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: CREAM }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
        {/* Left copy */}
        <div className="flex-1 max-w-xl">
          <p
            className="text-[15px] font-semibold tracking-wide uppercase mb-4"
            style={{ color: LAVENDER }}
          >
            Cancer Care Support
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 mb-6">
            Helping patients navigate cancer care with{' '}
            <span style={{ color: TEAL }}>confidence</span> and{' '}
            <span style={{ color: LAVENDER }}>comfort</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            Track medications, log symptoms, manage appointments, and stay connected with your care
            team — all in one calm, easy-to-use platform designed for patients and their loved ones.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white text-lg font-semibold transition hover:opacity-90"
              style={{ backgroundColor: TEAL }}
            >
              Get Started <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border-2 text-lg font-semibold transition hover:bg-gray-50"
              style={{ borderColor: TEAL, color: TEAL }}
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Right image + floating card */}
        <div className="flex-1 relative max-w-lg w-full">
          <img
            src="https://raw.createusercontent.com/ccfc8f38-dd19-4e96-91a8-a07a93511958/"
            alt="Nurse comforting a patient"
            className="rounded-3xl shadow-xl w-full object-cover aspect-[3/2]"
          />
          {/* Floating card */}
          <div
            className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-lg p-5 flex items-center gap-3"
            style={{ border: `2px solid ${LAVENDER}20` }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: LAVENDER_BG }}
            >
              <HeartHandshake className="w-6 h-6" style={{ color: LAVENDER }} />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-[17px]">You&apos;re not alone.</p>
              <p className="text-sm text-gray-500">We&apos;re here every step of the way.</p>
            </div>
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
    description:
      'Log your vitals and symptoms, then run an AI-powered risk assessment to get personalised insights and suggested next steps.',
    color: TEAL,
    bg: TEAL_LIGHT,
  },
  {
    icon: Pill,
    title: 'Medication Reminders',
    description:
      'Keep track of every dose with clear schedules, one-tap logging, and automatic alerts if a dose is missed.',
    color: CORAL,
    bg: '#FEF2F2',
  },
  {
    icon: CalendarCheck,
    title: 'Upcoming Appointments',
    description:
      'Never miss a consultation, treatment session, or lab test. See everything in one glance with easy-to-read cards.',
    color: LAVENDER,
    bg: LAVENDER_BG,
  },
  {
    icon: Users,
    title: 'Caregiver Support',
    description:
      'Invite family or caregivers with a simple code. They can monitor vitals, respond to alerts, and be there when it counts.',
    color: TEAL,
    bg: TEAL_LIGHT,
  },
];

function FeatureCards() {
  return (
    <section id="features" className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need, In One Place
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Built with love for patients and families navigating cancer treatment.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl p-7 border border-gray-100 hover:shadow-lg transition-shadow flex flex-col"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: f.bg }}
                >
                  <Icon className="w-7 h-7" style={{ color: f.color }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-[16px] text-gray-500 leading-relaxed flex-1">{f.description}</p>
                <Link
                  href="/register"
                  className="mt-5 inline-flex items-center gap-1 font-semibold text-[15px] transition hover:gap-2"
                  style={{ color: f.color }}
                >
                  Learn more <ChevronRight className="w-4 h-4" />
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
const TRUST_ITEMS = [
  { icon: Smile, label: 'Easy to Use' },
  { icon: ShieldCheck, label: 'Secure & Private' },
  { icon: HeartHandshake, label: 'Compassionate Guidance' },
  { icon: Star, label: 'Trusted by Families' },
];

function TrustStrip() {
  return (
    <section style={{ backgroundColor: TEAL_LIGHT }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {TRUST_ITEMS.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white shadow-sm">
                  <Icon className="w-7 h-7" style={{ color: TEAL }} />
                </div>
                <p className="font-semibold text-[17px] text-gray-800">{t.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonial + CTA ─────────────────────────────────────────── */
function Testimonial() {
  return (
    <section id="testimonials" style={{ backgroundColor: LAVENDER_BG }} className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-14">
        {/* Quote */}
        <div className="flex-1 max-w-xl">
          <div className="flex gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <blockquote className="text-2xl md:text-[26px] leading-relaxed text-gray-800 italic mb-6">
            &ldquo;Lifeway gave me peace of mind during the hardest time of my life. The medication
            reminders and my daughter&apos;s ability to check on me made all the difference.&rdquo;
          </blockquote>
          <p className="font-bold text-lg text-gray-900">Margaret T.</p>
          <p className="text-gray-500">Breast cancer survivor, age 72</p>
        </div>

        {/* CTA card */}
        <div className="flex-1 max-w-md w-full bg-white rounded-3xl shadow-lg p-10 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4" style={{ color: CORAL }} fill={CORAL} />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Hope. Support. Together.</h3>
          <p className="text-gray-500 text-[17px] mb-8 leading-relaxed">
            Join thousands of patients and caregivers who trust Lifeway to simplify their cancer
            care journey.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white text-lg font-semibold transition hover:opacity-90"
            style={{ backgroundColor: TEAL }}
          >
            Get Started Free <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer id="contact" className="bg-gray-50 border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-7 h-7" style={{ color: TEAL }} fill={TEAL} />
              <span className="text-xl font-bold" style={{ color: TEAL }}>
                Lifeway
              </span>
            </div>
            <p className="text-gray-500 text-[15px] leading-relaxed">
              Compassionate cancer care support for patients and families.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-[17px]">Quick Links</h4>
            <ul className="space-y-2.5 text-[15px] text-gray-500">
              <li>
                <Link href="/" className="hover:text-gray-800 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-gray-800 transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-gray-800 transition">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-gray-800 transition">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-[17px]">Contact Us</h4>
            <ul className="space-y-3 text-[15px] text-gray-500">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" style={{ color: TEAL }} /> 1-800-123-4567
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" style={{ color: TEAL }} /> support@lifeway.care
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: TEAL }} /> 123 Wellness Blvd
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-[17px]">Support Hours</h4>
            <ul className="space-y-2.5 text-[15px] text-gray-500">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" style={{ color: TEAL }} /> Mon–Fri: 8am – 8pm
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" style={{ color: TEAL }} /> Sat–Sun: 9am – 5pm
              </li>
            </ul>
            <div
              className="mt-5 flex items-center gap-2 text-[14px] font-semibold"
              style={{ color: TEAL }}
            >
              <ShieldCheck className="w-5 h-5" /> HIPAA Compliant
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 text-center text-sm text-gray-400">
          Lifeway Cancer Support · Built with care
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <FeatureCards />
      <TrustStrip />
      <Testimonial />
      <Footer />
    </div>
  );
}
