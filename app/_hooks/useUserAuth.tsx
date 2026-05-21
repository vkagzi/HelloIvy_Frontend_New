'use client';

import { useSession, signOut } from 'next-auth/react';
import { clearAuthCache } from '@/lib/api';
import { broadcastLogout } from '@/lib/auth-broadcast';
import type { Session } from 'next-auth';

type UserAuthContextType = {
  isAuthenticated: boolean;
  logout: () => void;
  userDetails: {
    email: string;
    name: string;
    first_name: string;
    last_name: string;
    id: number;
  };
};

export const useUserAuth = (
  serverSession?: Session | null
): UserAuthContextType => {
  const { data: clientSession, status } = useSession({
    required: false,
  });

  // Prefer client-side session (which updates reactively) over static serverSession
  const session = clientSession || serverSession;
  const isAuthenticated =
    clientSession !== undefined
      ? !!clientSession
      : (serverSession !== undefined ? !!serverSession : status === 'authenticated');

  const logout = (): void => {
    broadcastLogout();
    clearAuthCache();
    signOut({ callbackUrl: '/login' });
  };

  const userDetails = {
    email: session?.user?.email || '',
    first_name: session?.user?.first_name || '',
    last_name: session?.user?.last_name || '',
    name: session?.user?.name || session?.user?.email || '',
    id: session?.user?.id ? parseInt(session.user.id) : 0,
  };

  return {
    isAuthenticated,
    logout,
    userDetails,
  };
};
