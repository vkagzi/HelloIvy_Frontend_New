'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api-client';

export interface ModuleChoice {
  value: string;
  label: string;
}

let cachedModules: ModuleChoice[] | null = null;

export function useModuleChoices() {
  const [modules, setModules] = useState<ModuleChoice[]>(cachedModules ?? []);
  const [loading, setLoading] = useState(cachedModules === null);

  useEffect(() => {
    if (cachedModules !== null) return;
    api<{ modules: ModuleChoice[] }>('/api/accounts/module-choices/')
      .then((d) => {
        cachedModules = d.modules;
        setModules(d.modules);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { modules, loading };
}
