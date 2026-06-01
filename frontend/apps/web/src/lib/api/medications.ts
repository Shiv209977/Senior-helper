import { apiFetch } from './client';
import type { Medication, MedicationLog, PaginatedResponse } from './types';

export async function listMedications(page = 1): Promise<PaginatedResponse<Medication>> {
  return apiFetch(`/medications/?page=${page}`);
}

export async function createMedication(data: {
  medicine_name: string;
  dosage: string;
  start_date: string;
  end_date?: string | null;
  frequency_type?: string;
  scheduled_times?: string[];
  grace_period_minutes?: number;
  instructions?: string;
}): Promise<Medication> {
  return apiFetch('/medications/', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateMedication(id: number, data: Partial<Medication>): Promise<Medication> {
  return apiFetch(`/medications/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function listMedicationLogs(page = 1): Promise<PaginatedResponse<MedicationLog>> {
  return apiFetch(`/medication-logs/?page=${page}`);
}

export async function createMedicationLog(data: {
  medication: number;
  scheduled_datetime: string;
  status: string;
  notes?: string;
}): Promise<MedicationLog> {
  return apiFetch('/medication-logs/', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateMedicationLog(
  id: number,
  data: Partial<MedicationLog>
): Promise<MedicationLog> {
  return apiFetch(`/medication-logs/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
}
