import { apiFetch } from './client';
import type { EmergencyRequest, PaginatedResponse } from './types';

export async function listEmergencies(page = 1): Promise<PaginatedResponse<EmergencyRequest>> {
  return apiFetch(`/emergencies/?page=${page}`);
}

export async function createEmergency(data?: {
  emergency_type?: string;
  message?: string;
}): Promise<EmergencyRequest> {
  return apiFetch('/emergencies/', { method: 'POST', body: JSON.stringify(data ?? {}) });
}

export async function acknowledgeEmergency(id: number): Promise<EmergencyRequest> {
  return apiFetch(`/emergencies/${id}/acknowledge/`, { method: 'POST' });
}

export async function resolveEmergency(id: number): Promise<EmergencyRequest> {
  return apiFetch(`/emergencies/${id}/resolve/`, { method: 'POST' });
}
