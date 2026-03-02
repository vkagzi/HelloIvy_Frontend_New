'use client';

import React, { useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { clearAuthCache } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface SessionExpiredModalProps {
  isOpen: boolean;
}

/**
 * Non-dismissible modal shown when the user's session has expired
 * (logout from another tab, server-side JWT expiry, or 401 from API).
 *
 * Clicking "Login" cleans up local auth state and redirects to /login
 * with a callbackUrl so the user returns to the page they were on.
 */
export default function SessionExpiredModal({
  isOpen,
}: SessionExpiredModalProps): React.ReactElement | null {
  const handleLogin = useCallback(async () => {
    // Build callbackUrl from the current page
    const currentPath =
      window.location.pathname + window.location.search;
    const callbackUrl = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;

    // Clean up local auth caches
    clearAuthCache();

    // Sign out from NextAuth without its own redirect – we handle it
    await signOut({ redirect: false });

    // Navigate to login
    window.location.href = callbackUrl;
  }, []);

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        /* non-dismissible – intentionally empty */
      }}
    >
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Hide the default close button via CSS */}
        <style>{`
          [data-radix-dialog-content] > button[class*="absolute right"] {
            display: none !important;
          }
        `}</style>

        {/* Warning icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-7 w-7 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <DialogTitle className="text-center text-xl">
          Session Expired
        </DialogTitle>

        <DialogDescription className="mt-2 text-center text-sm text-gray-600">
          You have been logged out. Please login again to continue.
        </DialogDescription>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLogin}
            className="rounded-lg bg-purple-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Login
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
