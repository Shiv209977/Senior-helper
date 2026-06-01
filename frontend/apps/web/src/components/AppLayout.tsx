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

const TEAL = '#1B7A6E';

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

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F9F7F4' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-7 h-7" style={{ color: TEAL }} fill={TEAL} />
            <span className="text-lg font-bold" style={{ color: TEAL }}>
              Lifeway
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[16px] font-medium transition"
                style={{
                  backgroundColor: active ? '#E8F5F2' : 'transparent',
                  color: active ? TEAL : '#6B7280',
                }}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-2 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[15px]"
              style={{ backgroundColor: TEAL }}
            >
              {user?.full_name?.charAt(0) ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-gray-800 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <Heart className="w-7 h-7" style={{ color: TEAL }} fill={TEAL} />
                <span className="text-lg font-bold" style={{ color: TEAL }}>
                  Lifeway
                </span>
              </Link>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[16px] font-medium transition"
                    style={{
                      backgroundColor: active ? '#E8F5F2' : 'transparent',
                      color: active ? TEAL : '#6B7280',
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  handleLogout();
                  setSidebarOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] text-gray-500 hover:text-red-600 w-full"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 h-[64px] flex items-center px-4 lg:px-8 gap-4">
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1" />
          <Link
            href={
              user?.role === 'admin'
                ? '/admin'
                : user?.role === 'caregiver'
                  ? '/caregiver'
                  : '/patient/today'
            }
            className="relative p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <Bell className="w-5 h-5 text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
