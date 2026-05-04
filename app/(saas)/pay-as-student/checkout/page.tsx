import { Suspense } from 'react';
import PaymentCheckoutForm from '@/components/payment/PaymentCheckoutForm';
import type { CheckoutConfig } from '@/components/payment/PaymentCheckoutForm';
import { createStudentCheckout, confirmStudentPayment } from './actions';

const config: CheckoutConfig = {
  mode: 'student',
  createEndpoint: '/api/accounts/me/checkout/',
  confirmEndpoint: '/api/accounts/me/checkout/{payment_id}/confirm/',
  successRedirect: '/subscription',
  backUrl: '/pay-as-student',
  successMessage: 'Redirecting to your subscriptions…',
  title: 'Checkout',
};

export default function CheckoutPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{config.title}</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-neutral-100" />}>
        <PaymentCheckoutForm
          config={config}
          createCheckout={createStudentCheckout}
          confirmPayment={confirmStudentPayment}
        />
      </Suspense>
    </div>
  );
}
