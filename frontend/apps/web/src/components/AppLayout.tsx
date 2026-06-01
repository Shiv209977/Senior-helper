'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import {
  Heart,
  LayoutDashboard,
  Pill,
  CalendarCheck,
  Activity,
  Brain,
  User,
  Users,
  Bell,
  LogOut,
  Shield,
  FileText,
  Menu,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { listNotifications } from '@/lib/api/notifications';

type NavItem = { label: string; href: string; icon: React.ElementType };

const PATIENT_NAV: NavItem[] = [
  { label: 'Today', href: '/patient/today', icon: LayoutDashboard },
  { label: 'Medications', href: '/patient/medications', icon: Pill },
  { label: 'Appointments', href: '/patient/appointments', icon: CalendarCheck },
  { label: 'Vitals & Symptoms', href: '/patient/vitals', icon: Activity },
  { label: 'AI Assessment', href: '/patient/ai', icon: Brain },
  { label: 'Emergencies', href: '/patient/emergencies', icon: AlertTriangle },
  { label: 'Caregivers', href: '/patient/caregivers', icon: Users },
  { label: 'Profile', href: '/patient/profile', icon: User },
];

const CAREGIVER_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/caregiver', icon: LayoutDashboard },
  { label: 'Profile', href: '/caregiver/profile', icon: User },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Users', href: '/admin', icon: Shield },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
];

const ROLE_LABEL: Record<string, string> = {
  patient: 'Your Care',
  caregiver: 'Caregiver',
  admin: 'Administration',
};

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-2.5">
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
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems =
    user?.role === 'admin' ? ADMIN_NAV : user?.role === 'caregiver' ? CAREGIVER_NAV : PATIENT_NAV;

  const fetchUnread = useCallback(async () => {
    try {
      const data = await listNotifications(1);
      const unread = data.results.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const navList = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
      <p className="px-4 pb-2 font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {ROLE_LABEL[user?.role ?? 'patient'] ?? 'Menu'}
      </p>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[16px] font-medium transition-colors ${
              active
                ? 'bg-teal-soft text-teal-deep shadow-soft'
                : 'text-muted-foreground hover:bg-muted hover:text-ink'
            }`}
          >
            <Icon className={`h-5 w-5 ${active ? 'text-teal' : ''}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const userCard = (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-teal text-[15px] font-bold text-white">
        {user?.full_name?.charAt(0) ?? 'U'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{user?.full_name}</p>
        <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-border bg-sidebar lg:flex">
        <div className="border-b border-border p-6">
          <Brand />
        </div>
        {navList()}
        <div className="space-y-3 border-t border-border p-4">
          {userCard}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-coral-soft hover:text-coral"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="shadow-lift absolute bottom-0 left-0 top-0 flex w-[284px] flex-col bg-sidebar">
            <div className="flex items-center justify-between border-b border-border p-5">
              <Brand onClick={() => setSidebarOpen(false)} />
              <button onClick={() => setSidebarOpen(false)} aria-label="Close menu" className="p-1 text-muted-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
            {navList(() => setSidebarOpen(false))}
            <div className="space-y-3 border-t border-border p-4">
              {userCard}
              <button
                onClick={() => {
                  handleLogout();
                  setSidebarOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-coral-soft hover:text-coral"
              >
                <LogOut className="h-5 w-5" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-[264px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
          <button
            className="rounded-xl p-2 text-ink transition-colors hover:bg-muted lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="flex-1" />
          <Link
            href={
              user?.role === 'admin'
                ? '/admin'
                : user?.role === 'caregiver'
                  ? '/caregiver'
                  : '/patient/today'
            }
            className="relative rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-coral text-[11px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-6xl p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
