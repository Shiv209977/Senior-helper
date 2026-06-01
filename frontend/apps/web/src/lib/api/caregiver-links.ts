import { apiFetch } from './client';
import type { CaregiverLink } from './types';

/** Returns a PLAIN ARRAY (not paginated) */
export async function listCaregiverLinks(): Promise<CaregiverLink[]> {
  return apiFetch('/caregiver-links/');
}

/** Patient only — generates a new invite code */
export async function createInvite(): Promise<CaregiverLink> {
  return apiFetch('/caregiver-links/', { method: 'POST' });
}

/** Caregiver only — accepts an invite code */
export async function acceptInvite(invite_code: string): Promise<CaregiverLink> {
  return apiFetch('/caregiver-links/accept/', {
    method: 'POST',
    body: JSON.stringify({ invite_code }),
  });
}

/** Patient or admin — revokes a link */
export async function revokeLink(id: number): Promise<CaregiverLink> {
  return apiFetch(`/caregiver-links/${id}/revoke/`, { method: 'POST' });
}
