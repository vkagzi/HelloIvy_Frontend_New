'use server';

import { auth } from '@/auth';

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function serverFetch<T>(
  url: string,
  opts: { method?: string; body?: unknown; token?: string },
): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  const res = await fetch(fullUrl, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      msg = err.error || err.detail || err.message || msg;
    } catch {
      // keep default message
    }
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

export async function createStudentCheckout(body: {
  modules: string[];
  coupon_code?: string;
  billing_state?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}) {
  const session = await auth();
  const token = session?.accessToken;

  return serverFetch('/api/accounts/me/checkout/', {
    method: 'POST',
    body,
    token,
  });
}

export async function confirmStudentPayment(paymentId: number) {
  const session = await auth();
  const token = session?.accessToken;

  await serverFetch(`/api/accounts/me/checkout/${paymentId}/confirm/`, {
    method: 'POST',
    token,
  });
}
