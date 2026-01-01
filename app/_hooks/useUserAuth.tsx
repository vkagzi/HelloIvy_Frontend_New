'use client';

import { useSession, signOut } from 'next-auth/react';
import { clearAuthCache } from '@/lib/api';
import type { Session } from 'next-auth';

type UserAuthContextType = {
  isAuthenticated: boolean;
  logout: () => void;
  userDetails: {
    email: string;
    name: string;
    id: number;
  };
};

export const useUserAuth = (
  serverSession?: Session | null
): UserAuthContextType => {
  // Only call useSession if no server session is provided
  const { data: clientSession, status } = useSession({
    required: false,
  });

  // Use server session if provided, otherwise fall back to client session
  const session = serverSession !== undefined ? serverSession : clientSession;
  const isAuthenticated =
    serverSession !== undefined
      ? !!serverSession
      : status === 'authenticated';

  const logout = (): void => {
    clearAuthCache();
    signOut({ callbackUrl: '/login' });
  };

  const userDetails = {
    email: session?.user?.email || '',
    name: session?.user?.name || session?.user?.email || '',
    id: session?.user?.id ? parseInt(session.user.id) : 0,
  };

  return {
    isAuthenticated,
    logout,
    userDetails,
  };
};
