import { apiFetch } from '@/lib/api/client';
import type { ChatMessage, ChatResponse, PaginatedResponse } from '@/lib/api/types';

export async function sendChatMessage(content: string, patientId?: number) {
  return apiFetch<ChatResponse>('/chat/messages/', {
    method: 'POST',
    body: JSON.stringify({ content, patient_id: patientId }),
  });
}

export async function getChatHistory(patientId?: number) {
  const q = patientId ? `?patient_id=${patientId}` : '';
  return apiFetch<ChatMessage[]>(`/chat/history/${q}`);
}

export async function requestDigest(patientId: number) {
  return apiFetch<{ message: string }>('/chat/digest/', {
    method: 'POST',
    body: JSON.stringify({ patient_id: patientId }),
  });
}
