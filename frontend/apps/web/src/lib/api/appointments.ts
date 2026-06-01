import { apiFetch } from './client';
import type { Appointment, PaginatedResponse } from './types';

export async function listAppointments(page = 1): Promise<PaginatedResponse<Appointment>> {
  return apiFetch(`/appointments/?page=${page}`);
}

export async function createAppointment(data: {
  title: string;
  date: string;
  time: string;
  appointment_type?: string;
  hospital_name?: string;
  doctor_name?: string;
  notes?: string;
}): Promise<Appointment> {
  return apiFetch('/appointments/', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateAppointment(
  id: number,
  data: Partial<Appointment>
): Promise<Appointment> {
  return apiFetch(`/appointments/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
}
