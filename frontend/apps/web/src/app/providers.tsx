'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useState } from 'react';
import { PrefsProvider } from '@/lib/prefs';

// Create a client that persists across re-renders
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function Providers({ children }: { children: ReactNode }) {
  // Initialize query client once
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PrefsProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                'rounded-2xl border border-border bg-card text-ink shadow-lift font-sans text-[15px]',
              title: 'text-ink font-semibold',
              description: 'text-muted-foreground',
              success: 'border-teal/30',
              error: 'border-coral/30',
            },
          }}
        />
      </PrefsProvider>
    </QueryClientProvider>
  );
}
