'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';

interface LineItem {
  module: string;
  label: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

interface CheckoutSession {
  payment_id: number;
  order_id?: string;
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

function parseLineItems(modulesParam: string, maxQty: number, priceGetter: (mod: string) => number | null): LineItem[] {
  return modulesParam
    .split(',')
    .filter(Boolean)
    .map((entry) => {
      const [mod, qtyStr] = entry.split(':');
      const quantity = qtyStr ? Math.max(1, Math.min(maxQty, parseInt(qtyStr, 10) || 1)) : 1;
      const price = priceGetter(mod) ?? 0;
      return {
        module: mod,
        label: mod.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        quantity,
        price,
        lineTotal: price * quantity,
      };
    });
}

const formatCurrency = (num: number) => {
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function PaymentCheckoutForm({
  config,
  createCheckout,
  confirmPayment,
}: {
  config: CheckoutConfig;
  createCheckout?: (body: any) => Promise<any>;
  confirmPayment?: (paymentId: number) => Promise<void>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currencyParam = (searchParams?.get('currency') || (pathname?.includes('-usd') ? 'USD' : 'INR')).toUpperCase();
  const { getPrice } = useModuleChoices(currencyParam);
  const { data: authSession, status: authStatus } = useSession();
  const isLoggedIn = authStatus === 'authenticated' && !!authSession?.user;
  const modulesParam = searchParams?.get('modules') ?? '';
  const stateParam = searchParams?.get('state') ?? '';
  const couponCode = searchParams?.get('coupon_code') ?? '';
  const isUSD = currencyParam === 'USD';
  const discountAmount = parseFloat(searchParams?.get('discount') ?? '0');
  const taxAmount = parseFloat(searchParams?.get('tax') ?? '0');
  const grandTotal = parseFloat(searchParams?.get('total') ?? '0');

  const getCurrencySymbol = () => isUSD ? '$' : '₹';
  const formatAmt = (num: number) => num.toLocaleString(isUSD ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  // Payer type state
  const [payerType, setPayerType] = useState<'individual' | 'institution'>(
    config.mode === 'school' ? 'institution' : 'individual'
  );

  // Contact details state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
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

  // School mode: prefill details on mount
  useEffect(() => {
    if (config.mode !== 'school') return;
    if (initRef.current) return;
    initRef.current = true;

    setInitLoading(true);
    api<{ address?: string; email?: string; phone?: string }>(config.createEndpoint, { method: 'GET' })
      .then((data) => {
        if (data.address) setAddress(data.address);
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);
      })
      .catch((err: unknown) => {
        setInitError(err instanceof Error ? err.message : 'Failed to load checkout details');
      })
      .finally(() => {
        setInitLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isContactValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    phone.replace(/\D/g, '').length >= 10 &&
    address.trim().length > 0;

  const displayTotal = grandTotal || (session?.total ?? subtotal);
  const stateName = stateParam === 'maharashtra' ? 'Maharashtra' : stateParam === 'rest_of_india' ? 'Rest of India' : stateParam === 'outside_india' ? 'Outside of India' : '';
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
        address: address.trim(),
        gst_number: gstNumber.trim(),
        payer_type: payerType,
      };

      let result: CheckoutSession;

      if (config.mode === 'student') {
        // Student: create payment session now
        const modules = lineItems.flatMap((item) => Array.from({ length: item.quantity }, () => item.module));
        const body: any = {
          modules,
          billing_state: stateParam || undefined,
          coupon_code: couponCode || undefined,
          currency: currencyParam,
          ...contactDetails,
        };

        result = createCheckout
          ? await createCheckout(body)
          : await api<CheckoutSession>(config.createEndpoint, { method: 'POST', body });
      } else {
        // School: create session now with all contact/billing details included
        const body = {
          module_quantities: moduleQuantities,
          billing_state: stateParam || undefined,
          coupon_code: couponCode || undefined,
          currency: currencyParam,
          ...contactDetails
        };
        result = await api<CheckoutSession>(config.createEndpoint, { method: 'POST', body });
      }

      // Redirect to HDFC payment page
      if (result.payment_url) {
        window.location.href = result.payment_url;
        return;
      }

      if (displayTotal > 0) {
        throw new Error('Payment gateway URL was not received. Please try again.');
      }

      // Fallback: if no payment URL (free checkout)
      if (!isLoggedIn) {
        // Guest user: redirect to status page with order_id for verification
        const statusParams = new URLSearchParams({
          payment_id: String(result.payment_id),
          status: 'pending',
          type: config.mode,
        });
        if (result.order_id) statusParams.set('order_id', result.order_id);
        router.push(`/payment/status?${statusParams.toString()}`);
        return;
      }

      if (confirmPayment) {
        await confirmPayment(result.payment_id);
      } else {
        const confirmUrl = config.confirmEndpoint.replace('{payment_id}', String(result.payment_id));
        await api(confirmUrl, { method: 'POST' });
      }
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

          {/* Payer type */}
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-gray-700">I am paying as</label>
            <select
              value={payerType}
              onChange={(e) => setPayerType(e.target.value as 'individual' | 'institution')}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            >
              <option value="individual">I am an Individual</option>
              <option value="institution">I am an Institution</option>
            </select>
          </div>

          {/* Contact details */}
          <h2 className="mb-5 text-base font-semibold text-gray-900">Contact Details</h2>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  First name <span className="text-red-500">*</span>
                </label>
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
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Last name <span className="text-red-500">*</span>
                </label>
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
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Phone number <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Billing Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder={config.mode === 'school' ? "School Billing Address" : "Billing Address"}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                GST Number (Optional)
              </label>
              <Input
                type="text"
                placeholder="22AAAAA1111A1Z1"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
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
              `Pay ${getCurrencySymbol()}${formatAmt(displayTotal)}`
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
                <span className="font-medium text-gray-900">{getCurrencySymbol()}{formatAmt(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-4 space-y-2">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{getCurrencySymbol()}{formatAmt(subtotal)}</span>
            </div>

            {/* Discount */}
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm text-green-600 font-medium">
                <span>Discount {couponCode ? `(${couponCode})` : ''}</span>
                <span>- {getCurrencySymbol()}{formatAmt(discountAmount)}</span>
              </div>
            )}



            {/* Tax */}
            {taxAmount > 0 && stateParam && (
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{taxLabel}</span>
                <span>{getCurrencySymbol()}{formatAmt(taxAmount)}</span>
              </div>
            )}

            {/* State */}
            {stateName && <p className="text-xs text-gray-400">State: {stateName}</p>}
          </div>

          <div className="mt-3 border-t border-neutral-100 pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-purple-700">
              {getCurrencySymbol()}{formatAmt(displayTotal)}
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