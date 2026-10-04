import { ApiError } from './api';

export interface Account {
  user: { id: string; name: string; email: string | null; provider: string };
  project: { id: string; name: string };
  csrf_token: string;
  ingest_url: string;
}
export interface Credential {
  id: string; name: string; prefix: string; created_at: string;
  last_used_at: string | null; revoked_at: string | null; expires_at: string | null;
}
export interface IssuedCredential extends Credential { key: string }

async function accountRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...options, credentials: 'same-origin', cache: 'no-store',
  });
  if (!response.ok) {
    let message = 'Could not complete this request. Try again.';
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') message = body.detail;
    } catch { /* Proxy response might not be JSON. */ }
    if (response.status === 401 && path !== '/auth/me') window.dispatchEvent(new Event('tracelab-session-expired'));
    throw new ApiError(message, response.status);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
export async function getAccount(): Promise<Account | null> {
  try { return await accountRequest<Account>('/auth/me'); }
  catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
}
export function getProviders() { return accountRequest<{ google: boolean; github: boolean }>('/auth/providers'); }
export function getCredentials() { return accountRequest<{ items: Credential[] }>('/credentials'); }
export function createCredential(name: string, expiresInDays: number, csrf: string) {
  return accountRequest<IssuedCredential>('/credentials', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
    body: JSON.stringify({ name, expires_in_days: expiresInDays }),
  });
}
export function revokeCredential(id: string, csrf: string) {
  return accountRequest<Credential>(`/credentials/${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: { 'X-CSRF-Token': csrf },
  });
}
export function logout(csrf: string) {
  return accountRequest<void>('/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrf } });
}
