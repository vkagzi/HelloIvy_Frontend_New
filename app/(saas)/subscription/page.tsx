'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ModuleSubscriptions from '@/components/ModuleSubscriptions';

export default function SubscriptionPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  const isB2BStudent =
    session?.user?.role === 'student' && !!session?.user?.school_id;

  return (
    <div className="space-y-6">
      <ModuleSubscriptions mode={isB2BStudent ? 'b2b' : 'b2c'} />
    </div>
  );
}
