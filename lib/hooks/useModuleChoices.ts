'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api-client';

export interface ModuleChoice {
  value: string;
  label: string;
  icon?: string;
  color?: string;
  price?: number;
}

interface ModuleChoicesResponse {
  modules: ModuleChoice[];
  currency?: string;
  default_price?: number;
}

const DEFAULT_PRICE = 999;
const DEFAULT_CURRENCY = 'INR';

const STATIC_MODULES: ModuleChoice[] = [
  {
    value: 'college_selector',
    label: 'College Selector',
    price: 4500,
    icon: 'school',
    color: 'bg-green-100 text-green-700',
  },
  {
    value: 'domain_discovery',
    label: 'Stream & Subject Selection',
    price: 999,
    icon: 'world',
    color: 'bg-cyan-100 text-cyan-700',
  },
];

export function useModuleChoices() {
  const [modules, setModules] = useState<ModuleChoice[]>(STATIC_MODULES);
  const [loading, setLoading] = useState<boolean>(true);
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [defaultPrice, setDefaultPrice] = useState<number>(DEFAULT_PRICE);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => {
    setTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;
    api<ModuleChoicesResponse>('/api/accounts/module-choices/')
      .then((data) => {
        if (!active) return;
        if (data && Array.isArray(data.modules)) {
          setModules(data.modules);
        }
        if (data?.currency) setCurrency(data.currency);
        if (data?.default_price != null) setDefaultPrice(data.default_price);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [trigger]);

  const prices: Record<string, number> = {};
  for (const m of modules) {
    if (m.price != null) prices[m.value] = m.price;
  }

  const getPrice = (moduleName: string): number =>
    prices[moduleName] ?? defaultPrice;

  return { modules, currency, defaultPrice, getPrice, loading, refetch };
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
