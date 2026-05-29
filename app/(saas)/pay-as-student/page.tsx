'use client';

import { Suspense } from 'react';
import ModuleSelectionForm from '@/components/payment/ModuleSelectionForm';
import type { ModuleSelectionConfig } from '@/components/payment/ModuleSelectionForm';

const config: ModuleSelectionConfig = {
  mode: 'student',
  maxQuantity: 10,
  quantityLabel: 'Quantity',
  unitLabel: 'unit',
  checkoutUrl: '/pay-as-student/checkout',
  topRightLink: { href: '/subscription', label: 'Payment History' },
  title: 'Select your Modules',
  subtitle: 'Set the quantity for each module you want. Setting quantity to 1 or more adds it to your order.',
  showActiveModules: true,
  restoreFromUrl: true,
};

export default function PayAsStudentPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-neutral-100" />}>
      <ModuleSelectionForm config={config} />
    </Suspense>
  );
}
