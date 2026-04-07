'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api-client';
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
  const { data: session, status, update } = useSession({ required: false });
  const [showModal, setShowModal] = useState(false);
  const hasFetched = useRef(false);

  // On mount (or refresh), fetch the latest terms_accepted from the API
  // and sync it with the session if it differs.
  useEffect(() => {
    if (status !== 'authenticated' || hasFetched.current) return;
    hasFetched.current = true;

    api<{ terms_accepted: boolean }>('/api/accounts/me/')
      .then((userData) => {
        const apiTerms = userData.terms_accepted ?? false;
        const sessionTerms = session?.user?.terms_accepted ?? false;

        if (apiTerms !== sessionTerms) {
          // Sync the session with the latest backend value
          update({ terms_accepted: apiTerms });
        }
      })
      .catch((err) => {
        console.error('TermsGuard: failed to fetch user data', err);
      });
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const needsTerms =
      status === 'authenticated' && session?.user?.terms_accepted === false;
    setShowModal(needsTerms);
  }, [status, session?.user?.terms_accepted]);

  return (
    <>
      {children}
      <TermsAcceptanceModal isOpen={showModal} />
    </>
  );
}
