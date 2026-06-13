import { apiFetch } from './client';
import type { PatientProfile, CaregiverProfile, PaginatedResponse } from './types';

/** Returns a PLAIN ARRAY (not paginated) */
export async function listPatientProfiles(): Promise<PatientProfile[]> {
  return apiFetch('/profiles/patients/');
}

export async function updatePatientProfile(
  id: number,
  data: Partial<PatientProfile>
): Promise<PatientProfile> {
  return apiFetch(`/profiles/patients/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function listCaregiverProfiles(
  page = 1
): Promise<PaginatedResponse<CaregiverProfile>> {
  return apiFetch(`/profiles/caregivers/?page=${page}`);
}

export async function updateCaregiverProfile(
  id: number,
  data: Partial<CaregiverProfile>
): Promise<CaregiverProfile> {
  return apiFetch(`/profiles/caregivers/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
}
