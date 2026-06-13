import { apiFetch, setTokens, clearTokens } from './client';
import type { AuthTokens, LoginPayload, RegisterPayload, User } from './types';

export async function register(payload: RegisterPayload): Promise<AuthTokens> {
  const data = await apiFetch<AuthTokens>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setTokens(data.access, data.refresh);
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const data = await apiFetch<AuthTokens>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setTokens(data.access, data.refresh);
  return data;
}

export async function getMe(): Promise<User> {
  return apiFetch<User>('/auth/me/');
}

export function logout() {
  clearTokens();
}
