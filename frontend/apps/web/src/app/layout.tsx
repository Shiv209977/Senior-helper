import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Fraunces, Mulish, Noto_Sans_Devanagari } from 'next/font/google';
import './global.css';
import { Providers } from './providers';

/* Display serif — warm, high-contrast, editorial. Carries the brand voice. */
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz', 'SOFT'],
  variable: '--font-display',
  display: 'swap',
});

/* Body / UI — humanist sans, rounded and friendly, highly legible at large sizes. */
const mulish = Mulish({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

/* Devanagari fallback so Hindi renders crisply (no missing-glyph "tofu"). */
const notoDeva = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-deva',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lifeway Cancer Support',
  description: 'Compassionate cancer care support for patients, caregivers, and care teams.',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${mulish.variable} ${notoDeva.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
