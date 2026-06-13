'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { getMe } from '@/lib/api/auth';
import type { Role } from '@/lib/api/types';

export default function AuthGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const router = useRouter();
  const { user, isLoading, setUser, setLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setUser(null);
      router.replace('/login');
      return;
    }

    if (!user) {
      setLoading(true);
      getMe()
        .then((u) => setUser(u))
        .catch(() => {
          setUser(null);
          router.replace('/login');
        });
    }
  }, [router, setLoading, setUser, user]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
    if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      const dest =
        user.role === 'admin'
          ? '/admin'
          : user.role === 'caregiver'
            ? '/caregiver'
            : '/patient/today';
      router.replace(dest);
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-teal-soft border-t-teal"
            style={{ animation: 'spin 0.9s linear infinite' }}
          />
          <p className="text-lg text-muted-foreground">Loading…</p>
        </div>
        <style jsx global>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
