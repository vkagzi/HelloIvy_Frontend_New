'use client';

import { Suspense } from 'react';
import ModuleSelectionForm from '@/components/payment/ModuleSelectionForm';
import type { ModuleSelectionConfig } from '@/components/payment/ModuleSelectionForm';

const config: ModuleSelectionConfig = {
  mode: 'school',
  maxQuantity: 200,
  quantityLabel: 'Students',
  unitLabel: 'student seat',
  checkoutUrl: '/school/payment/checkout',
  backLink: { href: '/school/subscription', label: 'Back to Buy Module' },
  title: 'Purchase New Modules (USD)',
  subtitle: 'Set the number of students for each module you want to purchase.',
  showActiveModules: true,
  restoreFromUrl: false,
  currency: 'USD',
};

export default function SchoolPaymentUSDPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-neutral-100" />}>
      <ModuleSelectionForm config={config} />
    </Suspense>
  );
}
