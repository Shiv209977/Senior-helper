// ─── Lifeway — Fetch wrapper with JWT auth ──────────────────────────────
const BASE_URL =
  typeof window !== 'undefined'
    ? ((window as any).__NEXT_PUBLIC_API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      'http://localhost:8000/api')
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api');

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

function setTokens(access: string, refresh?: string) {
  localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

/** Extract the best error message from a Django REST Framework error response */
export async function extractError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body.detail) return body.detail;
    if (body.non_field_errors) return body.non_field_errors[0];
    // per-field errors
    const firstKey = Object.keys(body)[0];
    if (firstKey && Array.isArray(body[firstKey])) {
      return `${firstKey}: ${body[firstKey][0]}`;
    }
    return JSON.stringify(body);
  } catch {
    return res.statusText || `Error ${res.status}`;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setTokens(data.access);
    return data.access;
  } catch {
    return null;
  }
}

/**
 * Core fetch wrapper.
 * - Adds Authorization header if token exists
 * - Auto-refreshes on 401
 * - Throws on non-2xx with extracted error message
 */
export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // Attempt refresh on 401
  if (res.status === 401 && token) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
    }
    const newToken = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    } else {
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please sign in again.');
    }
  }

  if (!res.ok) {
    const msg = await extractError(res);
    throw new Error(msg);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

export { BASE_URL, setTokens, getAccessToken };
