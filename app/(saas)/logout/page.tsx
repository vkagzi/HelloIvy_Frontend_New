'use client';
import React, { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

export default function Logout(): React.ReactElement {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.clear();
      // Redirect to home
      window.location.href = '/';
    }
  }, [isMounted]);

  return <></>;
}
