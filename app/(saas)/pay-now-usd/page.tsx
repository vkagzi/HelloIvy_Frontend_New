'use client';

import { Suspense } from 'react';
import ModuleSelectionForm from '@/components/payment/ModuleSelectionForm';
import type { ModuleSelectionConfig } from '@/components/payment/ModuleSelectionForm';

const config: ModuleSelectionConfig = {
  mode: 'student',
  maxQuantity: 10,
  quantityLabel: 'Quantity',
  unitLabel: 'unit',
  checkoutUrl: '/pay-now-usd/checkout',
  topRightLink: { href: '/subscription', label: 'Payment History' },
  title: 'Select your Modules (USD)',
  subtitle: 'Set the quantity for each module you want. Selection is in USD.',
  showActiveModules: true,
  restoreFromUrl: true,
  currency: 'USD',
};

export default function PayNowUSDPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-neutral-100" />}>
      <ModuleSelectionForm config={config} />
    </Suspense>
  );
}
