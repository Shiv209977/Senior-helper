import { apiFetch } from './client';
import type { Notification, PaginatedResponse } from './types';

export async function listNotifications(page = 1): Promise<PaginatedResponse<Notification>> {
  return apiFetch(`/notifications/?page=${page}`);
}

export async function markNotificationRead(id: number): Promise<Notification> {
  return apiFetch(`/notifications/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ is_read: true }),
  });
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return apiFetch('/notifications/mark-all-read/', { method: 'POST' });
}
