'use client';
import React, { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { clearAuthCache } from '@/lib/api-client';

/** Delete all cookies with the given name across path/domain variants. */
function clearCookie(name: string): void {
  const paths = ['/', ''];
  for (const p of paths) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p}`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p};secure`;
  }
}

function clearAllAuthCookies(): void {
  clearCookie('authjs.session-token');
  clearCookie('__Secure-authjs.session-token');
  clearCookie('authjs.csrf-token');
  clearCookie('__Secure-authjs.csrf-token');
  clearCookie('authjs.callback-url');
  clearCookie('__Host-authjs.csrf-token');
}

function cleanupAndRedirect(): void {
  clearAuthCache();
  try { localStorage.clear(); } catch { /* ignore */ }
  try { sessionStorage.clear(); } catch { /* ignore */ }
  clearAllAuthCookies();
  window.location.href = '/login';
}

export default function Logout(): React.ReactElement {
  useEffect(() => {
    // Race signOut against a timeout so we always redirect
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000));
    const doSignOut = signOut({ redirect: false }).catch(() => {});

    Promise.race([doSignOut, timeout]).then(cleanupAndRedirect);
  }, []);

  return <></>;
}
