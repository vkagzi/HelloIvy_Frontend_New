'use client';

import { Suspense } from 'react';
import PaymentCheckoutForm from '@/components/payment/PaymentCheckoutForm';
import type { CheckoutConfig } from '@/components/payment/PaymentCheckoutForm';

const config: CheckoutConfig = {
  mode: 'school',
  createEndpoint: '/api/accounts/school/checkout/',
  confirmEndpoint: '/api/accounts/school/checkout/{payment_id}/confirm/',
  successRedirect: '/school/dashboard',
  backUrl: '/school/payment',
  successMessage: "Your school's modules are now active. Redirecting…",
  title: 'School Checkout',
};

export default function SchoolCheckoutPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{config.title}</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-neutral-100" />}>
        <PaymentCheckoutForm config={config} />
      </Suspense>
    </div>
  );
}
