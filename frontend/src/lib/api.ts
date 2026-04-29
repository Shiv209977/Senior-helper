import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export type Role = "patient" | "caregiver" | "admin";

export type User = {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: Role;
  is_active: boolean;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login/", { email, password });
  return data as { access: string; refresh: string; user: User };
}

export async function register(payload: {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: "patient" | "caregiver";
}) {
  const { data } = await api.post("/auth/register/", payload);
  return data as { access: string; refresh: string; user: User };
}

export async function currentUser() {
  const { data } = await api.get("/auth/me/");
  return data as User;
}

export function dashboardPath(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "caregiver") return "/caregiver";
  return "/patient";
}

