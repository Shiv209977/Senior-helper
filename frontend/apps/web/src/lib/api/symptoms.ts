import { apiFetch } from './client';
import type { SymptomRecord, PaginatedResponse } from './types';

export async function listSymptoms(page = 1): Promise<PaginatedResponse<SymptomRecord>> {
  return apiFetch(`/symptoms/?page=${page}`);
}

export async function createSymptom(data: {
  symptom_date: string;
  fever?: boolean;
  nausea?: boolean;
  vomiting?: boolean;
  severe_pain?: boolean;
  breathing_difficulty?: boolean;
  dizziness?: boolean;
  bleeding?: boolean;
  fatigue?: boolean;
  appetite_loss?: boolean;
  infection_signs?: boolean;
  symptom_severity_score: number;
  notes?: string;
  patient?: number; // caregiver / admin only
}): Promise<SymptomRecord> {
  return apiFetch('/symptoms/', { method: 'POST', body: JSON.stringify(data) });
}
