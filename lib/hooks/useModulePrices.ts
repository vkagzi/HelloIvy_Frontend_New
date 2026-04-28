'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api-client';

interface ModulePricesResponse {
  prices: Record<string, number>;
  currency: string;
  default_price: number;
}

let cached: ModulePricesResponse | null = null;

export function useModulePrices() {
  const [prices, setPrices] = useState<Record<string, number>>(cached?.prices ?? {});
  const [currency, setCurrency] = useState<string>(cached?.currency ?? 'INR');
  const [defaultPrice, setDefaultPrice] = useState<number>(cached?.default_price ?? 999);
  const [loading, setLoading] = useState(cached === null);

  useEffect(() => {
    if (cached !== null) return;
    api<ModulePricesResponse>('/api/accounts/module-prices/')
      .then((d) => {
        cached = d;
        setPrices(d.prices);
        setCurrency(d.currency);
        setDefaultPrice(d.default_price);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getPrice = (moduleName: string) => prices[moduleName] ?? defaultPrice;

  return { prices, currency, defaultPrice, getPrice, loading };
}
