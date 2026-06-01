'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/* ── Shared field styles (premium: soft-filled, focus-elevate) ──────── */
export const INPUT =
  'w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3 text-[16px] text-ink transition-colors placeholder:text-muted-foreground/55 focus:border-ring focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30';
export const LABEL = 'mb-1.5 block text-[14px] font-semibold text-ink';

type Accent = 'teal' | 'lavender' | 'coral' | 'gold';
const CHIP: Record<Accent, string> = {
  teal: 'bg-teal-soft text-teal',
  lavender: 'bg-lavender-soft text-lavender',
  coral: 'bg-coral-soft text-coral',
  gold: 'bg-gold/15 text-gold',
};
const BLOB: Record<Accent, string> = {
  teal: 'bg-teal-soft',
  lavender: 'bg-lavender-soft',
  coral: 'bg-coral-soft',
  gold: 'bg-gold/20',
};

/* ── Premium page header: atmospheric card with icon chip + action ──── */
export function PageHeader({
  icon,
  title,
  subtitle,
  accent = 'teal',
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  accent?: Accent;
  action?: ReactNode;
}) {
  return (
    <header className="animate-rise relative mb-8 overflow-hidden rounded-[1.75rem] border border-border bg-card px-6 py-6 shadow-soft">
      <div className={`bloom -right-12 -top-12 h-44 w-44 ${BLOB[accent]}`} />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${CHIP[accent]}`}>
            {icon}
          </span>
          <div>
            <h1 className="text-3xl sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-1 text-lg text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}

export function Spinner({ className = 'py-20' }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <div
        className="h-11 w-11 rounded-full border-4 border-teal-soft border-t-teal"
        style={{ animation: 'lwspin 0.9s linear infinite' }}
      />
      <style jsx global>{`
        @keyframes lwspin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  accent = 'teal',
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  accent?: Accent;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-soft">
      <span className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl ${CHIP[accent]}`}>
        {icon}
      </span>
      <p className="text-xl text-ink">{title}</p>
      {hint && <p className="mt-1 text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={LABEL}>
        {label}
        {required && <span className="text-coral"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[13px] font-medium text-coral">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[13px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/* ── Accessible dialog: Esc to close, focus-trap, focus return ──────── */
export function useDialogA11y<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      node
        ? Array.from(
            node.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.offsetParent !== null)
        : [];

    // Focus the first interactive element (or the dialog itself).
    const first = focusables()[0];
    (first ?? node)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const items = focusables();
        if (items.length === 0) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return ref;
}
