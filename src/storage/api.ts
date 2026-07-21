import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from '../lib/supabaseClient';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4f58e216`;

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not signed in');

  // Validate token with server (getSession alone can return stale JWTs)
  const { error: userError } = await supabase.auth.getUser();
  if (userError) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session?.access_token) {
      throw new Error('Session expired — please sign in again');
    }
    return refreshData.session.access_token;
  }

  return session.access_token;
}

export async function apiFetchAuth<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await getAccessToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: publicAnonKey,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Retry once after refresh
    const { data: refreshData } = await supabase.auth.refreshSession();
    const retryToken = refreshData.session?.access_token;
    if (retryToken) {
      const retry = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${retryToken}`,
          apikey: publicAnonKey,
          ...options.headers,
        },
      });
      if (retry.ok) return retry.json() as Promise<T>;
    }
  }

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

/** @deprecated Use apiFetchAuth for user-scoped data */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}
