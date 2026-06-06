'use client';

import { Suspense } from 'react';
import ModuleSelectionForm from '@/components/payment/ModuleSelectionForm';
import type { ModuleSelectionConfig } from '@/components/payment/ModuleSelectionForm';

const config: ModuleSelectionConfig = {
  mode: 'student',
  maxQuantity: 10,
  quantityLabel: 'Quantity',
  unitLabel: 'unit',
  checkoutUrl: '/pay-now-inr/checkout',
  topRightLink: { href: '/subscription', label: 'Payment History' },
  title: 'Select your Modules (INR)',
  subtitle: 'Set the quantity for each module you want. Selection is in INR.',
  showActiveModules: true,
  restoreFromUrl: true,
  currency: 'INR',
};

export default function PayNowINRPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-neutral-100" />}>
      <ModuleSelectionForm config={config} />
    </Suspense>
  );
}
