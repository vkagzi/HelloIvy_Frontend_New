'use client';

import React from 'react';
import { useSessionExpiry } from '@/app/_hooks/useSessionExpiry';
import SessionExpiredModal from '@/app/_components/SessionExpiredModal';

/**
 * Wraps authenticated page content and renders the session-expired
 * modal when a cross-tab logout or backend 401 is detected.
 *
 * Must be placed **inside** `<SessionProvider>` so that `getSession()`
 * calls in the hook have access to the NextAuth context.
 */
export default function SessionGuard({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { isSessionExpired } = useSessionExpiry();

  return (
    <>
      {children}
      <SessionExpiredModal isOpen={isSessionExpired} />
    </>
  );
}
