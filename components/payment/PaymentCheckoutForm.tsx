'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { useModulePrices } from '@/lib/hooks/useModulePrices';

interface LineItem {
  module: string;
  label: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

interface CheckoutSession {
  payment_id: number;
  line_items: { module: string; label: string; price: number }[];
  total: number;
  currency: string;
  num_students?: number;
  price_per_student?: number;
  payment_url?: string;
}

export interface CheckoutConfig {
  mode: 'student' | 'school';
  /** API endpoint to create the checkout session */
  createEndpoint: string;
  /** API endpoint pattern to confirm payment (use {payment_id} placeholder) */
  confirmEndpoint: string;
  /** Where to redirect on success */
  successRedirect: string;
  /** Where to redirect back to edit cart */
  backUrl: string;
  /** Success message subtext */
  successMessage: string;
  /** Page title */
  title: string;
}

function parseLineItems(modulesParam: string, maxQty: number, priceGetter: (mod: string) => number): LineItem[] {
  return modulesParam
    .split(',')
    .filter(Boolean)
    .map((entry) => {
      const [mod, qtyStr] = entry.split(':');
      const quantity = qtyStr ? Math.max(1, Math.min(maxQty, parseInt(qtyStr, 10) || 1)) : 1;
      const price = priceGetter(mod);
      return {
        module: mod,
        label: mod.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        quantity,
        price,
        lineTotal: price * quantity,
      };
    });
}

export default function PaymentCheckoutForm({ config }: { config: CheckoutConfig }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: authSession, status: authStatus } = useSession();
  const { getPrice } = useModulePrices();
  const isLoggedIn = authStatus === 'authenticated' && !!authSession?.user;
  const modulesParam = searchParams?.get('modules') ?? '';
  const stateParam = searchParams?.get('state') ?? '';
  const couponCode = searchParams?.get('coupon') ?? '';
  const discountAmount = parseInt(searchParams?.get('discount') ?? '0', 10);
  const taxAmount = parseInt(searchParams?.get('tax') ?? '0', 10);
  const grandTotal = parseInt(searchParams?.get('total') ?? '0', 10);

  const maxQty = config.mode === 'school' ? 200 : 10;
  const lineItems = parseLineItems(modulesParam, maxQty, getPrice);
  const subtotal = lineItems.reduce((s, i) => s + i.lineTotal, 0);

  // Parse per-module quantities for school mode
  const moduleQuantities: Record<string, number> = {};
  if (config.mode === 'school') {
    modulesParam
      .split(',')
      .filter(Boolean)
      .forEach((entry) => {
        const [mod, qtyStr] = entry.split(':');
        moduleQuantities[mod] = Math.max(1, parseInt(qtyStr ?? '1', 10) || 1);
      });
  }

  // School mode: initialise checkout session on mount
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(config.mode === 'school');
  const initRef = useRef(false);

  // Contact details state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactLocked, setContactLocked] = useState({ firstName: false, lastName: false, email: false });

  // Prefill from session for logged-in users
  useEffect(() => {
    if (!isLoggedIn || !authSession?.user) return;
    const u = authSession.user;
    if (u.first_name) { setFirstName(u.first_name); setContactLocked((p) => ({ ...p, firstName: true })); }
    if (u.last_name) { setLastName(u.last_name); setContactLocked((p) => ({ ...p, lastName: true })); }
    if (u.email) { setEmail(u.email); setContactLocked((p) => ({ ...p, email: true })); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Redirect if no modules
  useEffect(() => {
    if (!modulesParam || modulesParam.split(',').filter(Boolean).length === 0) {
      router.replace(config.backUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // School mode: create checkout session on mount
  useEffect(() => {
    if (config.mode !== 'school') return;
    if (initRef.current) return;
    initRef.current = true;

    if (!modulesParam || Object.keys(moduleQuantities).length === 0) {
      router.replace(config.backUrl);
      return;
    }

    api<CheckoutSession>(config.createEndpoint, {
      method: 'POST',
      body: { module_quantities: moduleQuantities, coupon_code: couponCode || undefined, billing_state: stateParam || undefined },
    })
      .then((data) => setSession(data))
      .catch((err: unknown) => setInitError(err instanceof Error ? err.message : 'Failed to initialise checkout'))
      .finally(() => setInitLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isContactValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    phone.replace(/\D/g, '').length >= 10;

  const displayTotal = grandTotal || (session?.total ?? subtotal);
  const stateName = stateParam === 'maharashtra' ? 'Maharashtra' : stateParam === 'rest_of_india' ? 'Rest of India' : '';
  const taxLabel = stateParam === 'maharashtra' ? 'GST (9% CGST + 9% SGST)' : 'IGST (18%)';

  const handlePay = async () => {
    if (!isContactValid) return;
    setProcessing(true);
    setPayError(null);
    try {
      const contactDetails = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };

      let result: CheckoutSession;

      if (config.mode === 'student') {
        // Student: create payment session now
        const modules = lineItems.flatMap((item) => Array.from({ length: item.quantity }, () => item.module));
        result = await api<CheckoutSession>(config.createEndpoint, {
          method: 'POST',
          body: { modules, coupon_code: couponCode || undefined, billing_state: stateParam || undefined, ...contactDetails },
        });
      } else {
        // School: session already created on mount
        if (!session) return;
        result = session;
      }

      // Redirect to HDFC payment page
      if (result.payment_url) {
        window.location.href = result.payment_url;
        return;
      }

      // Fallback: if no payment URL (dummy gateway), confirm directly
      const confirmUrl = config.confirmEndpoint.replace('{payment_id}', String(result.payment_id));
      await api(confirmUrl, { method: 'POST' });
      router.push(config.successRedirect);
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // School init loading
  if (initLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
      </div>
    );
  }

  // School init error
  if (initError) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{initError}</p>
        <button onClick={() => router.push(config.backUrl)} className="mt-4 cursor-pointer text-sm text-purple-600 hover:underline">
          ← Back to modules
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Back button */}
      <button
        onClick={() => {
          const params = new URLSearchParams({ modules: modulesParam });
          if (stateParam) params.set('state', stateParam);
          if (couponCode) params.set('coupon', couponCode);
          router.push(`${config.backUrl}?${params.toString()}`);
        }}
        className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        ← Back to order
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Contact form */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          {payError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{payError}</div>
          )}

          {/* Contact details */}
          <h2 className="mb-5 text-base font-semibold text-gray-900">Contact Details</h2>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">First name</label>
                <Input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  readOnly={contactLocked.firstName}
                  className={contactLocked.firstName ? 'bg-gray-50 text-gray-500' : ''}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Last name</label>
                <Input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  readOnly={contactLocked.lastName}
                  className={contactLocked.lastName ? 'bg-gray-50 text-gray-500' : ''}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={contactLocked.email}
                className={contactLocked.email ? 'bg-gray-50 text-gray-500' : ''}
              />
              {!isLoggedIn && config.mode === 'student' && (
                <p className="mt-1.5 text-xs text-amber-600">
                  ⚠ Important — this email will be given access to the purchased modules.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Phone number</label>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            🔒 You will be redirected to HDFC&apos;s secure payment page to complete the transaction.
          </p>

          <button
            onClick={handlePay}
            disabled={!isContactValid || processing}
            className="mt-6 w-full cursor-pointer rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Redirecting to payment…
              </span>
            ) : (
              `Pay ₹${typeof displayTotal === 'number' ? displayTotal.toLocaleString('en-IN') : displayTotal}`
            )}
          </button>
        </div>

        {/* Order summary */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Order Summary</h2>

          {/* Line items */}
          <div className="space-y-3">
            {lineItems.map((item) => (
              <div key={item.module} className="flex items-start justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-800">{item.label}</span>
                  {item.quantity > 1 && <span className="ml-1 text-gray-400">× {item.quantity}</span>}
                </div>
                <span className="font-medium text-gray-900">₹{item.lineTotal}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-4 space-y-2">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            {/* Discount */}
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm text-green-600">
                <span>Discount{couponCode ? ` (${couponCode})` : ''}</span>
                <span>−₹{discountAmount}</span>
              </div>
            )}

            {/* Tax */}
            {taxAmount > 0 && stateParam && (
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{taxLabel}</span>
                <span>₹{taxAmount}</span>
              </div>
            )}

            {/* State */}
            {stateName && <p className="text-xs text-gray-400">State: {stateName}</p>}
          </div>

          <div className="mt-3 border-t border-neutral-100 pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-purple-700">
              ₹{typeof displayTotal === 'number' ? displayTotal.toLocaleString('en-IN') : displayTotal}
            </span>
          </div>

          <button
            onClick={() => router.push(config.backUrl)}
            className="mt-4 cursor-pointer text-xs text-gray-400 hover:text-gray-600 hover:underline"
          >
            ← Edit cart
          </button>
        </div>
      </div>
    </div>
  );
}