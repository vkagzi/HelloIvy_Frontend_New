'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api-client';
import { FiIcon } from '@/app/_components/Icons';

interface LineItem {
  module: string;
  label: string;
  price: number;
}

interface CheckoutSession {
  payment_id: number;
  line_items: LineItem[];
  num_students: number;
  price_per_student: number;
  total: number;
  currency: string;
}

function SchoolCheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modulesParam = searchParams?.get('modules') ?? '';
  const numStudentsParam = parseInt(searchParams?.get('num_students') ?? '1', 10) || 1;

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');

  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (!modulesParam) {
      router.replace('/school/payment');
      return;
    }
    const modules = modulesParam.split(',').filter(Boolean);
    if (modules.length === 0) {
      router.replace('/school/payment');
      return;
    }
    api<CheckoutSession>('/api/accounts/school/checkout/', {
      method: 'POST',
      body: { modules, num_students: numStudentsParam },
    })
      .then((data) => setSession(data))
      .catch((err: unknown) =>
        setInitError(err instanceof Error ? err.message : 'Failed to initialise checkout')
      )
      .finally(() => setInitLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCard = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const isFormValid =
    nameOnCard.trim().length > 0 &&
    cardNumber.replace(/\s/g, '').length === 16 &&
    expiry.length === 5 &&
    cvv.length >= 3;

  const handlePay = async () => {
    if (!session || !isFormValid) return;
    setProcessing(true);
    setPayError(null);
    try {
      await new Promise((res) => setTimeout(res, 1800));
      await api(`/api/accounts/school/checkout/${session.payment_id}/confirm/`, {
        method: 'POST',
      });
      setSuccess(true);
      setTimeout(() => router.push('/school/dashboard'), 1500);
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (initLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
      </div>
    );
  }

  if (initError) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{initError}</p>
        <button onClick={() => router.push('/school/payment')} className="mt-4 cursor-pointer text-sm text-purple-600 hover:underline">
          ← Back to modules
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-green-200 bg-green-50 p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <FiIcon name="check" className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Payment Successful!</h2>
        <p className="mt-1 text-sm text-gray-500">Your school&apos;s modules are now active. Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_380px]">
      {/* Card form */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-gray-900">Payment Details</h2>

        {payError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{payError}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Name on card</label>
            <input
              type="text"
              placeholder="John Doe"
              value={nameOnCard}
              onChange={(e) => setNameOnCard(e.target.value)}
              className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Card number</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCard(e.target.value))}
              className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 font-mono text-sm shadow-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Expiry (MM/YY)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 font-mono text-sm shadow-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">CVV</label>
              <input
                type="password"
                inputMode="numeric"
                placeholder="•••"
                maxLength={4}
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 font-mono text-sm shadow-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          This is a demo checkout. No real payment is processed.
        </p>

        <button
          onClick={handlePay}
          disabled={!isFormValid || processing}
          className="mt-6 w-full cursor-pointer rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Processing…
            </span>
          ) : (
            `Pay ₹${session?.total?.toLocaleString('en-IN') ?? 0}`
          )}
        </button>
      </div>

      {/* Order summary */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Order Summary</h2>
        <div className="space-y-3">
          {session?.line_items.map((item) => (
            <div key={item.module} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{item.label}</span>
              <span className="font-medium text-gray-900">₹{item.price}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-neutral-100 pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Price per student</span>
            <span className="font-medium text-gray-700">₹{session?.price_per_student?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Number of students</span>
            <span className="font-medium text-gray-700">{session?.num_students}</span>
          </div>
          <div className="mt-2 border-t border-neutral-100 pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-purple-700">₹{session?.total?.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <button
          onClick={() => router.push('/school/payment')}
          className="mt-4 cursor-pointer text-xs text-gray-400 hover:text-gray-600 hover:underline"
        >
          ← Edit cart
        </button>
      </div>
    </div>
  );
}

export default function SchoolCheckoutPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">School Checkout</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-neutral-100" />}>
        <SchoolCheckoutForm />
      </Suspense>
    </div>
  );
}
