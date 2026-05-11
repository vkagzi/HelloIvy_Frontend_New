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

// TODO: restore API call once backend is ready
// const fetcher = () => api<ModuleChoicesResponse>('/api/accounts/module-choices/');
const STATIC_MODULES: ModuleChoice[] = [
  { value: 'college_selector', label: 'College Selector', price: 4500, icon: 'school', color: 'bg-green-100 text-green-700' },
  { value: 'career_discovery', label: 'Career & Degree Selection', price: 999, icon: 'briefcase', color: 'bg-purple-100 text-purple-700' },
  { value: 'domain_discovery', label: 'Stream & Subject Selection', price: 999, icon: 'world', color: 'bg-cyan-100 text-cyan-700' },
];

export function useModuleChoices() {
  const modules = STATIC_MODULES;
  const loading = false;
  const currency = DEFAULT_CURRENCY;
  const defaultPrice = DEFAULT_PRICE;

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
