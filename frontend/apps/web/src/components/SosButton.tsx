'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth';
import { createEmergency } from '@/lib/api/emergencies';
import { useDialogA11y } from '@/components/ui-kit';
import { usePrefs } from '@/lib/prefs';

/**
 * Always-visible emergency action, fixed bottom-right on every authed page.
 * Patients trigger an alert to their care team; caregivers jump to alerts.
 */
export default function SosButton() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { t } = usePrefs();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const dialogRef = useDialogA11y<HTMLDivElement>(() => setOpen(false));

  if (!user || user.role === 'admin') return null;

  // Caregivers: quick jump to their alerts dashboard.
  if (user.role === 'caregiver') {
    return (
      <button
        onClick={() => router.push('/caregiver')}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-coral px-5 py-3.5 text-[15px] font-bold text-white shadow-lift transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/40"
        aria-label="View patient alerts"
      >
        <AlertTriangle className="h-5 w-5" /> {t('nav.emergencies')}
      </button>
    );
  }

  const trigger = async () => {
    setSending(true);
    try {
      await createEmergency({ message });
      setOpen(false);
      setMessage('');
      toast.success('Help is on the way', {
        description: 'Your caregivers and care team have been alerted.',
      });
    } catch (err: any) {
      toast.error('Could not send alert', { description: err?.message ?? 'Please try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-coral px-6 py-4 text-[16px] font-bold text-white shadow-lift transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/40"
        aria-label={t('sos.help')}
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-coral/40 group-hover:hidden" />
        <AlertTriangle className="h-6 w-6" /> SOS
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sos-title"
            tabIndex={-1}
            className="shadow-lift relative w-full max-w-md rounded-[1.75rem] bg-card p-8 text-center"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
            >
              <X className="h-6 w-6" />
            </button>
            <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-coral-soft">
              <AlertTriangle className="h-8 w-8 text-coral" />
            </span>
            <h2 id="sos-title" className="mb-2 text-2xl">
              {t('sos.help')}
            </h2>
            <p className="mb-4 text-muted-foreground">
              This alerts your caregivers and care team right away. For a life-threatening
              emergency, also call <span className="font-semibold text-ink">112</span>.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="mb-4 w-full resize-none rounded-xl border border-transparent bg-muted/50 px-4 py-3 text-[16px] text-ink transition-colors placeholder:text-muted-foreground/55 focus:border-ring focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30"
              placeholder="Optional: describe your situation"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border-2 border-border py-3 font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={trigger}
                disabled={sending}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-coral py-3 font-semibold text-white transition-colors hover:bg-destructive disabled:opacity-50"
              >
                <Phone className="h-5 w-5" /> {sending ? 'Sending…' : 'Alert Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
