'use client';
import React, { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { broadcastLogout } from '@/lib/auth-broadcast';

export const dynamic = 'force-dynamic';

export default function Logout(): React.ReactElement {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      // Notify other tabs that we're logging out
      broadcastLogout();
      // Clear localStorage
      localStorage.clear();
      // Sign out from NextAuth and redirect to home
      signOut({ callbackUrl: '/' });
    }
  }, [isMounted]);

  return <></>;
}
