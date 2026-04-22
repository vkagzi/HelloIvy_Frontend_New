'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api-client';

export interface ModuleChoice {
  value: string;
  label: string;
  icon?: string;
  color?: string;
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

/** Build lookup maps from the modules array returned by useModuleChoices(). */
export function buildModuleLookups(modules: ModuleChoice[]) {
  const labels: Record<string, string> = {};
  const icons: Record<string, string> = {};
  const colors: Record<string, string> = {};
  for (const m of modules) {
    labels[m.value] = m.label;
    if (m.icon) icons[m.value] = m.icon;
    if (m.color) colors[m.value] = m.color;
  }
  return { labels, icons, colors };
}
