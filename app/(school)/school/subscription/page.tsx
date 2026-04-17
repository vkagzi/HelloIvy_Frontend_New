'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ModuleSubscriptions from '@/components/ModuleSubscriptions';

export default function SchoolSubscriptionPage() {
  const { data: session, status } = useSession();

  const allowedRoles = ['schooladmin', 'schoolopsadmin'];
  if (status === 'authenticated' && !allowedRoles.includes(session?.user?.role ?? '')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-gray-800">Access Denied</p>
        <p className="mt-2 text-sm text-gray-500">Only school admins can access this page.</p>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Link
          href="/school/payment"
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          Purchase More Modules
        </Link>
      </div>

      <ModuleSubscriptions mode="school" />
    </div>
  );
}
