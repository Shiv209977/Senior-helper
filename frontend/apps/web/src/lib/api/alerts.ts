import { apiFetch } from './client';
import type { Alert, PaginatedResponse } from './types';

export async function listAlerts(page = 1): Promise<PaginatedResponse<Alert>> {
  return apiFetch(`/alerts/?page=${page}`);
}

export async function acknowledgeAlert(id: number, note?: string): Promise<Alert> {
  return apiFetch(`/alerts/${id}/acknowledge/`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export async function resolveAlert(id: number, note?: string): Promise<Alert> {
  return apiFetch(`/alerts/${id}/resolve/`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}
