'use client';

import { getSession } from 'next-auth/react';
import { broadcastLogout, dispatchSessionExpired } from '@/lib/auth-broadcast';

/* eslint-disable @typescript-eslint/no-explicit-any */

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  tokenOverride?: string;
  /** When true, body is sent as-is (e.g. FormData) — no JSON.stringify, no Content-Type header. */
  rawBody?: boolean;
  /** Expected response type. Defaults to 'json'. */
  responseType?: 'json' | 'blob' | 'text' | 'raw';
};

// Cache session token to avoid calling getSession on every request
// Using sessionStorage for persistence across re-renders
const CACHE_KEY = 'auth_token_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Pending promise to prevent concurrent getSession calls
let pendingSessionRequest: Promise<string | null> | null = null;

const getCachedToken = (): { token: string; expiry: number } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
};

const setCachedToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ token, expiry: Date.now() + CACHE_DURATION })
    );
  } else {
    sessionStorage.removeItem(CACHE_KEY);
  }
};

const getAuthToken = async (): Promise<string | null> => {
  // Check cache first
  const cached = getCachedToken();
  if (cached && cached.expiry > Date.now()) {
    return cached.token;
  }

  // If there's already a pending request, wait for it
  if (pendingSessionRequest) {
    return pendingSessionRequest;
  }

  // Create a new request and store the promise
  pendingSessionRequest = (async () => {
    try {
      const session = await getSession();
      const token = session?.accessToken || null;
      setCachedToken(token);
      return token;
    } finally {
      pendingSessionRequest = null;
    }
  })();

  return pendingSessionRequest;
};

const api = async <T = any>(
  url: string,
  options: ApiOptions = {}
): Promise<T> => {
  let token = options.tokenOverride;

  // Get token from Auth.js session if not overridden
  if (!token && typeof window !== 'undefined') {
    token = (await getAuthToken()) || undefined;
  }

  const isRawBody = options.rawBody || options.body instanceof FormData;

  const headers: Record<string, string> = {
    // Don't set Content-Type for FormData — the browser sets it with the boundary
    ...(isRawBody ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const res = await fetch(fullUrl, {
    method: options.method || 'GET',
    headers,
    body: isRawBody ? options.body : options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
    next: { revalidate: 0 },
    credentials: 'same-origin',
  });

  if (!res.ok) {
    let errorBody: {
      error: string;
      [key: string]: any;
    };
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { error: `Request failed with status ${res.status}` };
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error(`API request failed with status ${res.status}:`, errorBody);
    }

    // Session expired or token invalid – notify all tabs
    if (res.status === 401) {
      clearAuthCache();
      broadcastLogout();
      dispatchSessionExpired();
    }

    throw new Error(errorBody.error, {
      cause: {
        status: res.status,
        body: errorBody,
      },
    });
  }

  const responseType = options.responseType || 'json';
  if (responseType === 'blob') return res.blob() as Promise<T>;
  if (responseType === 'text') return res.text() as Promise<T>;
  if (responseType === 'raw') return res as unknown as T;

  // Handle 204 No Content or empty responses
  if (res.status === 204) return {} as T;

  return res.json();
};

export const me = async (): Promise<{
  email: string;
  name: string;
  id: number;
}> => {
  return api('/api/accounts/me/');
};

// Legacy token functions - kept for backward compatibility
// These will use Auth.js session in the background
const getToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  return await getAuthToken();
};

const setToken = (token: string): void => {
  console.warn(
    'setToken is deprecated. Auth.js handles token management automatically.'
  );
};

const removeToken = (): void => {
  console.warn(
    'removeToken is deprecated. Use signOut from next-auth/react instead.'
  );
  // Clear cached token when user logs out
  clearAuthCache();
};

// Export function to clear auth cache (useful for logout)
export const clearAuthCache = (): void => {
  setCachedToken(null);
  pendingSessionRequest = null;
};

export const streamApi = async (
  url: string,
  options: ApiOptions = {}
): Promise<ReadableStream<Uint8Array>> => {
  let token = options.tokenOverride;

  if (!token && typeof window !== 'undefined') {
    token = (await getAuthToken()) || undefined;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  // Build query params if GET and body exists
  let finalUrl = fullUrl;
  if (options.method === 'GET' && options.body) {
    const params = new URLSearchParams();
    Object.entries(options.body).forEach(([key, value]) => {
      params.append(key, String(value));
    });
    const connector = finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${connector}${params.toString()}`;
  }

  const res = await fetch(finalUrl, {
    method: options.method || 'GET',
    headers,
    body: options.method !== 'GET' && options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Streaming request failed: ${res.status}`);
  }

  if (!res.body) {
    throw new Error('Response body is null');
  }

  return res.body;
};

export default api;
export { getToken, setToken, removeToken, getAuthToken };
