'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import TermsAcceptanceModal from '@/app/_components/TermsAcceptanceModal';

/**
 * Renders a non-dismissible terms acceptance modal whenever the
 * authenticated user has not yet accepted the terms (terms_accepted = false).
 * Must be placed inside <SessionProvider>.
 */
export default function TermsGuard({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { data: session, status } = useSession();

  const needsTerms =
    status === 'authenticated' && session?.user?.terms_accepted === false;

  return (
    <>
      {children}
      <TermsAcceptanceModal isOpen={needsTerms} />
    </>
  );
}
