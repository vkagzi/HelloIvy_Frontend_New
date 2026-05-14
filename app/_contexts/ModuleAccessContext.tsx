'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api-client';
import { useSession } from 'next-auth/react';

type ModuleAccessContextType = {
  modules: string[];
  loading: boolean;
  hasAccess: (moduleName: string) => boolean;
};

const ModuleAccessContext = createContext<ModuleAccessContextType | undefined>(undefined);

export const ModuleAccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);

  const fetchModules = useCallback(async (): Promise<void> => {
    try {
      const data = await api<{ modules: string[] }>('/api/accounts/my-modules/');
      setModules(data.modules ?? []);
    } catch {
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      setModules([]);
      currentUserIdRef.current = null;
      setLoading(false);
      return;
    }

    if (status === 'authenticated' && session?.user?.id) {
      if (currentUserIdRef.current !== session.user.id) {
        currentUserIdRef.current = session.user.id;
        fetchModules();
      }
    }
  }, [status, session?.user?.id, fetchModules]);

  const hasAccess = useCallback(
    (moduleName: string): boolean => modules.includes(moduleName),
    [modules]
  );

  return (
    <ModuleAccessContext.Provider value={{ modules, loading, hasAccess }}>
      {children}
    </ModuleAccessContext.Provider>
  );
};

export const useModuleAccess = (): ModuleAccessContextType => {
  const ctx = useContext(ModuleAccessContext);
  if (!ctx) throw new Error('useModuleAccess must be used inside ModuleAccessProvider');
  return ctx;
};
