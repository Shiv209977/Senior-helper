import { apiFetch } from './client';
import type { User, AuditLog, PaginatedResponse } from './types';

export async function listUsers(page = 1): Promise<PaginatedResponse<User>> {
  return apiFetch(`/admin/users/?page=${page}`);
}

export async function updateUser(
  id: number,
  data: { full_name?: string; phone?: string; is_active?: boolean }
): Promise<User> {
  return apiFetch(`/admin/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function listAuditLogs(page = 1): Promise<PaginatedResponse<AuditLog>> {
  return apiFetch(`/admin/audit-logs/?page=${page}`);
}
