'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api-client';

type ModuleAccessContextType = {
  modules: string[];
  loading: boolean;
  hasAccess: (moduleName: string) => boolean;
};

const ModuleAccessContext = createContext<ModuleAccessContextType | undefined>(undefined);

export const ModuleAccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);

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
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchModules();
  }, [fetchModules]);

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
