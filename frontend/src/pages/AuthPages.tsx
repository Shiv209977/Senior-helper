import { HeartHandshake } from "lucide-react";
import { FormEvent, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { dashboardPath } from "@/lib/api";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const user = await login(email, password);
      navigate(dashboardPath(user.role));
    } catch {
      setError("Login failed. Please check the email and password.");
    }
  }

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to manage care routines, alerts, and risk checks.">
      <form className="grid gap-5" onSubmit={submit}>
        <Label>
          Email
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Label>
        <Label>
          Password
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </Label>
        {error ? <p className="rounded-2xl bg-red-100 p-3 font-bold text-red-800">{error}</p> : null}
        <Button type="submit">Login</Button>
        <p className="text-base font-semibold">
          New here? <Link className="text-[#b65f3a] underline" to="/register">Create an account</Link>
        </p>
      </form>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", role: "patient" as "patient" | "caregiver", password: "" });
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const user = await register(form);
      navigate(dashboardPath(user.role));
    } catch {
      setError("Registration failed. Try a different email and use at least 8 password characters.");
    }
  }

  return (
    <AuthFrame title="Create your care account" subtitle="Choose patient or caregiver. Admin accounts are created from the backend.">
      <form className="grid gap-5" onSubmit={submit}>
        <Label>
          Full name
          <Input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required />
        </Label>
        <Label>
          Email
          <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </Label>
        <Label>
          Phone
          <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </Label>
        <Label>
          Role
          <Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as "patient" | "caregiver" })}>
            <option value="patient">Patient</option>
            <option value="caregiver">Caregiver</option>
          </Select>
        </Label>
        <Label>
          Password
          <Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        </Label>
        {error ? <p className="rounded-2xl bg-red-100 p-3 font-bold text-red-800">{error}</p> : null}
        <Button type="submit">Create account</Button>
      </form>
    </AuthFrame>
  );
}

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-xl">
        <div className="mb-6 flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-3xl bg-[#f2c66d] text-[#17211d]">
            <HeartHandshake size={30} aria-hidden />
          </span>
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-2 text-lg font-semibold text-[#5b665f]">{subtitle}</p>
          </div>
        </div>
        {children}
      </Card>
    </div>
  );
}
