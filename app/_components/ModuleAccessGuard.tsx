'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useModuleAccess } from '@/app/_contexts/ModuleAccessContext';

// TODO: Remove PAYWALL_DISABLED flag and restore access guard when ready
const PAYWALL_DISABLED = true;

interface ModuleAccessGuardProps {
  moduleName: string;
  moduleDisplay: string;
  children: React.ReactNode;
}

const ModuleAccessGuard: React.FC<ModuleAccessGuardProps> = ({
  moduleName,
  moduleDisplay,
  children,
}) => {
  const { hasAccess, loading } = useModuleAccess();
  const { data: session } = useSession();
  const hasSchool = !!session?.user?.school_id;

  if (PAYWALL_DISABLED) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (!hasAccess(moduleName)) {
    const message = hasSchool
      ? 'Your school has not subscribed to this module. Please contact your school administrator to request access.'
      : 'This module is not part of your current plan.';

    const hint = hasSchool
      ? 'If you believe this is a mistake, reach out to your school admin or HelloIvy support.'
      : null;

    return (
      <div className="flex min-h-full items-center justify-center bg-linear-to-br from-slate-50 via-white to-teal-50 p-4">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 h-48 w-48 rounded-full bg-linear-to-br from-teal-100 to-emerald-100 opacity-40 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-36 w-36 rounded-full bg-linear-to-tr from-blue-100 to-purple-100 opacity-40 blur-3xl" />

            <div className="relative flex flex-col items-center gap-5 text-center">
              {/* Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-teal-100 to-emerald-50 text-3xl shadow-sm">
                🔒
              </div>

              {/* Text */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900">{moduleDisplay}</h2>
                <p className="text-sm font-semibold uppercase tracking-wider text-teal-600">
                  Access Restricted
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
              </div>

              {/* Divider */}
              <div className="w-full border-t border-gray-100" />

              {/* CTA / hint */}
              {!hasSchool ? (
                <Link
                  href="/pay-as-student"
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
                >
                  Unlock this module →
                </Link>
              ) : (
                <p className="text-xs text-gray-400">{hint}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ModuleAccessGuard;
