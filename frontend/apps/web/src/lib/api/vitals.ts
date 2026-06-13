import { apiFetch } from './client';
import type { VitalSign, PaginatedResponse } from './types';

export async function listVitals(page = 1): Promise<PaginatedResponse<VitalSign>> {
  return apiFetch(`/vitals/?page=${page}`);
}

export async function createVital(data: {
  recorded_at: string;
  temperature?: string | null;
  heart_rate?: number | null;
  oxygen_level?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  pain_level?: number;
  fatigue_level?: number;
  appetite_level?: number;
  notes?: string;
  patient?: number; // caregiver / admin only
}): Promise<VitalSign> {
  return apiFetch('/vitals/', { method: 'POST', body: JSON.stringify(data) });
}
