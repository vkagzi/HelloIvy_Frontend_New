/**
 * Server-side API helper for forwarding requests to the Django backend.
 * Used in pages/api/* route handlers.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface ForwardOptions {
  /** The backend path to forward to (e.g. '/api/interview-prep/sessions/'). */
  path: string;
  /** Allowed HTTP methods. Defaults to the method of the incoming request. */
  method?: string;
  /** Custom headers to add to the forwarded request. */
  headers?: Record<string, string>;
  /** Body to forward. Defaults to JSON.stringify(req.body) for non-GET requests. */
  body?: BodyInit;
  /** Skip auto-setting Content-Type (e.g. for FormData). */
  rawBody?: boolean;
  /** Status code to return on success. Defaults to 200. */
  successStatus?: number;
}

/**
 * Forward an API request to the Django backend.
 * Automatically handles auth header forwarding, error responses, and JSON parsing.
 */
export async function forwardToBackend(
  req: NextApiRequest,
  res: NextApiResponse,
  options: ForwardOptions
): Promise<void> {
  const method = options.method || req.method || 'GET';
  const isRawBody = options.rawBody || options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isRawBody ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  // Forward the Authorization header from the incoming request
  const authHeader = req.headers.authorization;
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const url = `${BACKEND_BASE_URL}${options.path}`;

  let body: BodyInit | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    if (options.body !== undefined) {
      body = options.body;
    } else if (!isRawBody && req.body) {
      body = JSON.stringify(req.body);
    }
  }

  try {
    const backendRes = await fetch(url, { method, headers, body });
    const data = await backendRes.json();

    if (!backendRes.ok) {
      return res.status(backendRes.status).json(data);
    }

    return res.status(options.successStatus || 200).json(data);
  } catch (error) {
    console.error(`Error forwarding ${method} ${options.path}:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Build the full backend URL for a given path.
 * Useful for cases where you need direct fetch (e.g. FormData with files).
 */
export function getBackendUrl(path: string): string {
  return `${BACKEND_BASE_URL}${path}`;
}
