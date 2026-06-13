import { apiFetch } from './client';
import type { AIRiskAssessment, PaginatedResponse } from './types';

export async function listAssessments(page = 1): Promise<PaginatedResponse<AIRiskAssessment>> {
  return apiFetch(`/ai-assessments/?page=${page}`);
}

/** patient: send {}; caregiver/admin: send { patient: id } */
export async function runAssessment(patientId?: number): Promise<AIRiskAssessment> {
  const body = patientId ? { patient: patientId } : {};
  return apiFetch('/ai-assessments/', { method: 'POST', body: JSON.stringify(body) });
}
