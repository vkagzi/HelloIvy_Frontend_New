'use client';

import useSWR from 'swr';
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

const fetcher = () => api<ModuleChoicesResponse>('/api/accounts/module-choices/');

export function useModuleChoices() {
  const { data, isLoading: loading } = useSWR('module-choices', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const modules = data?.modules ?? [];
  const currency = data?.currency ?? DEFAULT_CURRENCY;
  const defaultPrice = data?.default_price ?? DEFAULT_PRICE;

  const prices: Record<string, number> = {};
  for (const m of modules) {
    if (m.price != null) prices[m.value] = m.price;
  }

  const getPrice = (moduleName: string): number => prices[moduleName] ?? defaultPrice;

  return { modules, currency, defaultPrice, getPrice, loading };
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
