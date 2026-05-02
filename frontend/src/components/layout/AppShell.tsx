import { HeartPulse, LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const nav = {
  patient: [
    ["Dashboard", "/patient"],
    ["Profile", "/patient/profile"],
    ["Medications", "/patient/medications"],
    ["Appointments", "/patient/appointments"],
    ["Health + AI", "/patient/health"],
  ],
  caregiver: [
    ["Dashboard", "/caregiver"],
    ["Alerts", "/caregiver/alerts"],
  ],
  admin: [
    ["Overview", "/admin"],
    ["Users", "/admin/users"],
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#d8cebd] bg-[#fffaf0]/86 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="flex items-center gap-3 text-[#17211d]">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#21473e] text-white">
              <HeartPulse aria-hidden />
            </span>
            <span>
              <span className="block text-xl font-black">Senior Care Companion</span>
              <span className="text-sm font-semibold text-[#5b665f]">Supportive care, reminders, and safe AI risk checks</span>
            </span>
          </Link>
          {user ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e6f0ea] px-4 py-2 font-bold text-[#21473e]">
                <ShieldCheck size={18} aria-hidden /> {user.full_name} · {user.role}
              </span>
              <Button variant="ghost" onClick={logout}>
                <LogOut size={18} aria-hidden /> Logout
              </Button>
            </div>
          ) : null}
        </div>
        {user ? (
          <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 pb-4">
            {nav[user.role].map(([label, href]) => (
              <NavLink
                key={href}
                to={href}
                end={href === `/${user.role}`}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-base font-bold ${isActive ? "bg-[#21473e] text-white" : "bg-[#e9dfcf] text-[#21473e]"}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        ) : null}
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
