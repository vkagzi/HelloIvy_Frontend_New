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
}

export default function PaymentStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams?.get('payment_id') ?? '';
  const paymentType = searchParams?.get('type') ?? 'student';

  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!paymentId) {
      setStatus('failed');
      setMessage('Invalid payment. No payment ID found.');
      return;
    }

    const checkStatus = async () => {
      try {
        const data = await api<StatusResponse>(
          `/api/accounts/payment/${paymentId}/status/?type=${paymentType}`
        );

        if (data.status === 'completed') {
          setStatus('completed');
          setMessage(data.message);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === 'failed') {
          setStatus('failed');
          setMessage(data.message);
          if (pollRef.current) clearInterval(pollRef.current);
        } else {
          setStatus('pending');
          setMessage(data.message || 'Payment is being processed...');
          attemptRef.current += 1;
          // Stop polling after 10 attempts (~30 seconds)
          if (attemptRef.current >= 10 && pollRef.current) {
            clearInterval(pollRef.current);
            setMessage('Payment verification is taking longer than expected. Please check your payment history.');
          }
        }
      } catch {
        setStatus('failed');
        setMessage('Unable to verify payment status. Please check your payment history.');
        if (pollRef.current) clearInterval(pollRef.current);
      }
    };

    // Check immediately
    checkStatus();

    // Poll every 3 seconds if still pending
    pollRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, paymentType]);

  const successRedirect = paymentType === 'school' ? '/school/dashboard' : '/subscription';
  const retryUrl = paymentType === 'school' ? '/school/payment' : '/pay-as-student';

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
            <div className="mt-6 space-y-3">
              <button
                onClick={() => router.push(retryUrl)}
                className="w-full cursor-pointer rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push(successRedirect)}
                className="w-full cursor-pointer rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
