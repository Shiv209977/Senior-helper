'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Locale = 'en' | 'hi';
export type TextScale = 'base' | 'large';

/* ── Translation dictionary ──────────────────────────────────────────
   Covers the app chrome (nav, common actions, page titles). English is
   the source of truth; missing keys fall back to the key's English value. */
const STRINGS = {
  // nav
  'nav.today': { en: 'Today', hi: 'आज' },
  'nav.medications': { en: 'Medications', hi: 'दवाइयाँ' },
  'nav.appointments': { en: 'Appointments', hi: 'अपॉइंटमेंट' },
  'nav.vitals': { en: 'Vitals & Symptoms', hi: 'विटल्स और लक्षण' },
  'nav.ai': { en: 'AI Assessment', hi: 'एआई आकलन' },
  'nav.emergencies': { en: 'Emergencies', hi: 'आपातकाल' },
  'nav.caregivers': { en: 'Caregivers', hi: 'देखभालकर्ता' },
  'nav.profile': { en: 'Profile', hi: 'प्रोफ़ाइल' },
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav.users': { en: 'Users', hi: 'उपयोगकर्ता' },
  'nav.auditLogs': { en: 'Audit Logs', hi: 'ऑडिट लॉग' },
  // sections
  'section.yourCare': { en: 'Your Care', hi: 'आपकी देखभाल' },
  'section.caregiver': { en: 'Caregiver', hi: 'देखभालकर्ता' },
  'section.administration': { en: 'Administration', hi: 'प्रशासन' },
  // common
  'common.signOut': { en: 'Sign Out', hi: 'साइन आउट' },
  'common.save': { en: 'Save Changes', hi: 'सहेजें' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'common.viewAll': { en: 'View all', hi: 'सभी देखें' },
  'common.loading': { en: 'Loading…', hi: 'लोड हो रहा है…' },
  'common.notifications': { en: 'Notifications', hi: 'सूचनाएँ' },
  // SOS
  'sos.label': { en: 'Emergency', hi: 'आपातकाल' },
  'sos.help': { en: 'Need urgent help?', hi: 'तुरंत मदद चाहिए?' },
} as const;

export type StringKey = keyof typeof STRINGS;

type PrefsContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  textScale: TextScale;
  setTextScale: (s: TextScale) => void;
  t: (key: StringKey) => string;
};

const PrefsContext = createContext<PrefsContextValue | null>(null);

const SCALE_PX: Record<TextScale, string> = { base: '17px', large: '20px' };

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [textScale, setTextScaleState] = useState<TextScale>('base');

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    const l = localStorage.getItem('lw_locale') as Locale | null;
    const s = localStorage.getItem('lw_text_scale') as TextScale | null;
    if (l === 'en' || l === 'hi') setLocaleState(l);
    if (s === 'base' || s === 'large') setTextScaleState(s);
  }, []);

  // Apply to <html>: lang attribute + base font-size.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  useEffect(() => {
    document.documentElement.style.fontSize = SCALE_PX[textScale];
  }, [textScale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('lw_locale', l);
  };
  const setTextScale = (s: TextScale) => {
    setTextScaleState(s);
    localStorage.setItem('lw_text_scale', s);
  };
  const t = (key: StringKey) => STRINGS[key]?.[locale] ?? STRINGS[key]?.en ?? key;

  return (
    <PrefsContext.Provider value={{ locale, setLocale, textScale, setTextScale, t }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used within PrefsProvider');
  return ctx;
}
