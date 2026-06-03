'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api-client';
import { FiIcon } from '@/app/_components/Icons';

type PaymentStatus = 'loading' | 'completed' | 'failed' | 'pending';

interface StatusResponse {
  payment_id: number;
  status: string;
  message: string;
  amount?: number;
  currency?: string;
}

function formatCurrency(amount: number, currency: string = 'INR'): string {
  const symbol = currency === 'INR' ? '₹' : currency + ' ';
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PaymentStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The Route Handler at /api/payment/return/ verifies with HDFC and
  // redirects here with payment_id, status, and type as query params.
  const paymentId = searchParams?.get('payment_id') ?? '';
  const paymentType = searchParams?.get('type') ?? 'student';
  // Pre-verified status from the Route Handler (completed | failed | pending).
  // If present, we can show the result immediately without polling.
  const initialStatus = searchParams?.get('status') ?? '';
  const initialAmount = searchParams?.get('amount') ?? '';
  const initialCurrency = searchParams?.get('currency') ?? 'INR';
  // order_id is passed for guest checkouts so we can poll without auth
  const orderId = searchParams?.get('order_id') ?? '';

  const [status, setStatus] = useState<PaymentStatus>(
    initialStatus === 'completed' ? 'completed'
    : initialStatus === 'failed' ? 'failed'
    : 'loading',
  );
  const [message, setMessage] = useState(
    initialStatus === 'completed' ? 'Payment successful! Your modules are now active.'
    : initialStatus === 'failed' ? 'Payment was not successful. Please try again.'
    : '',
  );
  const [amount, setAmount] = useState(initialAmount ? Number(initialAmount) : 0);
  const [currency, setCurrency] = useState(initialCurrency);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    // If the Route Handler already confirmed the status, no polling needed
    if (initialStatus === 'completed' || initialStatus === 'failed') return;

    if (!paymentId) {
      console.error('[PaymentStatus] No payment ID found in URL params');
      setStatus('failed');
      setMessage('Invalid payment. No payment ID found.');
      return;
    }

    const checkStatus = async () => {
      // Use the guest-status endpoint when order_id is available (guest checkout),
      // otherwise fall back to the authenticated status endpoint.
      const url = orderId
        ? `/api/accounts/payment/${paymentId}/guest-status/?order_id=${encodeURIComponent(orderId)}`
        : `/api/accounts/payment/${paymentId}/status/?type=${paymentType}`;
      console.log(`[PaymentStatus] Polling attempt ${attemptRef.current + 1}: ${url}`);
      try {
        const data = await api<StatusResponse>(url);

        if (data.status === 'completed') {
          setStatus('completed');
          setMessage(data.message);
          if (data.amount) setAmount(data.amount);
          if (data.currency) setCurrency(data.currency);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === 'failed') {
          setStatus('failed');
          setMessage(data.message);
          if (data.amount) setAmount(data.amount);
          if (data.currency) setCurrency(data.currency);
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          setStatus('pending');
          setMessage(data.message || 'Payment is being processed...');
          attemptRef.current += 1;
          if (attemptRef.current >= 10 && pollRef.current) {
            clearInterval(pollRef.current);
            setMessage('Payment verification is taking longer than expected. Please check your payment history.');
          }
        }
      } catch (err) {
        console.error('[PaymentStatus] API error:', err);
        setStatus('failed');
        setMessage('Unable to verify payment status. Please check your payment history.');
        if (pollRef.current) clearInterval(pollRef.current);
      }
    };

    checkStatus();
    pollRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, paymentType, initialStatus]);

  const isGuest = !!orderId;
  const successRedirect = isGuest ? '/pay-as-student' : (paymentType === 'school' ? '/school/dashboard' : '/subscription');
  const retryUrl = paymentType === 'school' ? '/school/payment' : '/pay-as-student';

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (status === 'failed') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push(retryUrl);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, retryUrl, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm text-center">
        {/* Loading */}
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Verifying Payment</h2>
            <p className="mt-2 text-sm text-gray-500">
              Please wait while we confirm your payment with the bank...
            </p>
          </>
        )}

        {/* Pending */}
        {status === 'pending' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Processing Payment</h2>
            <p className="mt-2 text-sm text-gray-500">{message}</p>
            <div className="mt-6">
              <button
                onClick={() => router.push(retryUrl)}
                className="w-full cursor-pointer rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Back to Payment Page
              </button>
            </div>
          </>
        )}

        {/* Success */}
        {status === 'completed' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <FiIcon name="check" className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Payment Successful!</h2>
            <p className="mt-2 text-sm text-gray-500">{message}</p>

            <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-4 text-left">
              <div className="flex justify-between py-1.5">
                <span className="text-sm text-gray-500">Order ID</span>
                <span className="text-sm font-semibold text-gray-900">{orderId || paymentId}</span>
              </div>
              {amount > 0 && (
                <div className="flex justify-between border-t border-gray-200 py-1.5">
                  <span className="text-sm text-gray-500">Amount Paid</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(amount, currency)}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push(successRedirect)}
              className="mt-6 w-full cursor-pointer rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Continue
            </button>
          </>
        )}

        {/* Failed */}
        {status === 'failed' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <FiIcon name="x" className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Payment Failed</h2>
            <p className="mt-2 text-sm text-gray-500">{message}</p>

            {paymentId && (
              <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-4 text-left">
                <div className="flex justify-between py-1.5">
                  <span className="text-sm text-gray-500">Order ID</span>
                  <span className="text-sm font-semibold text-gray-900">{orderId || paymentId}</span>
                </div>
                {amount > 0 && (
                  <div className="flex justify-between border-t border-gray-200 py-1.5">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(amount, currency)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 space-y-3">
              <p className="text-xs text-gray-400 italic">
                Redirecting you back to the payment page in {countdown} seconds...
              </p>
              <button
                onClick={() => router.push(retryUrl)}
                className="w-full cursor-pointer rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Try Again Now
              </button>
              <button
                onClick={() => router.push(successRedirect)}
                className="w-full cursor-pointer rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {isGuest ? 'Back to Home' : 'Go to Dashboard'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
