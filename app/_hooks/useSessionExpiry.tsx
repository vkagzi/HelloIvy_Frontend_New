'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSession } from 'next-auth/react';
import { CHANNEL_NAME, STORAGE_KEY } from '@/lib/auth-broadcast';

/**
 * Detects session expiry / cross-tab logout through three channels:
 *
 * 1. **BroadcastChannel** – instant notification when another tab calls
 *    `broadcastLogout()`.
 * 2. **`storage` event** – fallback for browsers without BroadcastChannel;
 *    fires when another tab writes to `localStorage`.
 * 3. **Custom DOM event `ivy:session-expired`** – fired by the API client
 *    in the *current* tab when a 401 is received.
 * 4. **`visibilitychange`** – when the user switches back to a stale tab,
 *    re-validate the NextAuth session; if it's gone, mark expired.
 *
 * Returns `isSessionExpired` (boolean) for the modal to consume.
 */
export function useSessionExpiry() {
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Track whether we *had* a valid session at some point so we don't
  // false-positive on the very first render before NextAuth loads.
  const hadSessionRef = useRef(false);

  // --- mark expired (idempotent) ---
  const markExpired = useCallback(() => {
    setIsSessionExpired(true);
  }, []);

  // --- 1. BroadcastChannel listener ---
  useEffect(() => {
    let channel: BroadcastChannel | null = null;

    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'logout') {
          markExpired();
        }
      };
    } catch {
      // BroadcastChannel not supported – rely on storage fallback
    }

    return () => {
      try {
        channel?.close();
      } catch {
        // ignore
      }
    };
  }, [markExpired]);

  // --- 2. localStorage storage event (fires in OTHER tabs only) ---
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        markExpired();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [markExpired]);

  // --- 3. Custom DOM event from API client (same tab 401) ---
  useEffect(() => {
    const onExpired = () => markExpired();
    window.addEventListener('ivy:session-expired', onExpired);
    return () => window.removeEventListener('ivy:session-expired', onExpired);
  }, [markExpired]);

  // --- 4. visibilitychange – re-check session on tab focus ---
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      if (isSessionExpired) return; // already showing modal

      try {
        const session = await getSession();
        if (session?.user) {
          // Session is still valid – remember that we had one
          hadSessionRef.current = true;
        } else if (hadSessionRef.current) {
          // We previously had a session but now it's gone → expired
          markExpired();
        }
      } catch {
        // getSession failed – could be a network issue, don't mark expired
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isSessionExpired, markExpired]);

  // --- Seed hadSessionRef on mount ---
  useEffect(() => {
    getSession().then((session) => {
      if (session?.user) {
        hadSessionRef.current = true;
      }
    }).catch(() => {
      // ignore
    });
  }, []);

  return { isSessionExpired };
}
