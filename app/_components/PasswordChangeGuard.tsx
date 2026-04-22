'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api-client';
import PasswordChangeModal from '@/app/_components/PasswordChangeModal';

/**
 * Renders a non-dismissible onboarding modal whenever the authenticated user
 * needs to change their password (force_password_change = true) and/or
 * accept terms (terms_accepted = false). Combines both flows into one modal.
 * Must be placed inside <SessionProvider>.
 */
export default function PasswordChangeGuard({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { data: session, status, update } = useSession({ required: false });
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [needsTerms, setNeedsTerms] = useState(false);
  const hasFetched = useRef(false);

  // On mount, fetch latest flags from the API and sync with session.
  useEffect(() => {
    if (status !== 'authenticated' || hasFetched.current) return;
    hasFetched.current = true;

    api<{ force_password_change: boolean; terms_accepted: boolean }>('/api/accounts/me/')
      .then((userData) => {
        const apiPwFlag = userData.force_password_change ?? false;
        const apiTerms = userData.terms_accepted ?? false;
        const sessionPwFlag = session?.user?.force_password_change ?? false;
        const sessionTerms = session?.user?.terms_accepted ?? false;

        const updates: Record<string, boolean> = {};
        if (apiPwFlag !== sessionPwFlag) updates.force_password_change = apiPwFlag;
        if (apiTerms !== sessionTerms) updates.terms_accepted = apiTerms;
        if (Object.keys(updates).length > 0) update(updates);
      })
      .catch((err) => {
        console.error('PasswordChangeGuard: failed to fetch user data', err);
      });
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status !== 'authenticated') {
      setNeedsPasswordChange(false);
      setNeedsTerms(false);
      return;
    }
    setNeedsPasswordChange(session?.user?.force_password_change === true);
    setNeedsTerms(session?.user?.terms_accepted === false);
  }, [status, session?.user?.force_password_change, session?.user?.terms_accepted]);

  const showModal = needsPasswordChange || needsTerms;

  return (
    <>
      {children}
      <PasswordChangeModal
        isOpen={showModal}
        needsPasswordChange={needsPasswordChange}
        needsTerms={needsTerms}
      />
    </>
  );
}
