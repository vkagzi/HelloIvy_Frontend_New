'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';
import api from '@/lib/api-client';
import { FiIcon } from '@/app/_components/Icons';

const MODULE_PRICE_INR = 999;

const VALID_COUPONS: Record<string, number> = {
  SAVE10: 10,
  SAVE20: 20,
  IVY15: 15,
};

const TAX_CONFIG = {
  maharashtra: { cgst: 9, sgst: 9, igst: 0 },
  rest_of_india: { cgst: 0, sgst: 0, igst: 18 },
} as const;

type StateOption = keyof typeof TAX_CONFIG;

interface ModuleRow {
  value: string;
  label: string;
  quantity: number;
}

const MODULE_ICONS: Record<string, string> = {
  essay_brainstormer: 'brain-circuit',
  essay_evaluator: 'list-check',
  college_selector: 'school',
  degree_selector: 'graduation-cap',
  interview_prep: 'videoconference',
  resume_builder: 'CV',
  career_discovery: 'briefcase',
  domain_discovery: 'world',
};

interface SchoolPayment {
  id: number;
  amount: string;
  currency: string;
  status: string;
  modules_purchased: string[];
  payment_gateway: string;
  gateway_transaction_id: string;
  notes: string;
  created_at: string;
}

interface ModuleSubscription {
  id: number;
  module_name: string;
  module_display: string;
  max_students: number | null;
  expiry_date: string;
  is_active: boolean;
  source: string;
  created_at: string;
  used_students: number;
  remaining_students: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

export default function SchoolPaymentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { modules: moduleChoices, loading: modulesLoading } = useModuleChoices();

  const [rows, setRows] = useState<ModuleRow[]>([]);
  const [selectedState, setSelectedState] = useState<StateOption | ''>('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPct: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [payments, setPayments] = useState<SchoolPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<ModuleSubscription[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  useEffect(() => {
    api<{ payments: SchoolPayment[] }>('/api/accounts/school/payments/')
      .then((data) => setPayments(data.payments ?? []))
      .catch(() => {})
      .finally(() => setLoadingPayments(false));

    api<{ subscriptions: ModuleSubscription[] }>('/api/accounts/school/subscriptions/')
      .then((data) => setSubscriptions(data.subscriptions ?? []))
      .catch(() => {})
      .finally(() => setLoadingSubscriptions(false));
  }, []);

  useEffect(() => {
    if (moduleChoices.length === 0) return;
    setRows(moduleChoices.map((m) => ({ value: m.value, label: m.label, quantity: 0 })));
  }, [moduleChoices]);

  const setQuantity = (value: string, quantity: number) =>
    setRows((prev) => prev.map((r) => (r.value === value ? { ...r, quantity } : r)));

  const selectedRows = rows.filter((r) => r.quantity > 0);
  const totalUnits = selectedRows.reduce((s, r) => s + r.quantity, 0);
  const subtotal = selectedRows.reduce((s, r) => s + MODULE_PRICE_INR * r.quantity, 0);
  const discountAmount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discountPct) / 100) : 0;
  const taxableAmount = subtotal - discountAmount;
  const taxes = selectedState ? TAX_CONFIG[selectedState] : { cgst: 0, sgst: 0, igst: 0 };
  const cgstAmount = Math.round((taxableAmount * taxes.cgst) / 100);
  const sgstAmount = Math.round((taxableAmount * taxes.sgst) / 100);
  const igstAmount = Math.round((taxableAmount * taxes.igst) / 100);
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const grandTotal = taxableAmount + totalTax;

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      setAppliedCoupon({ code, discountPct: VALID_COUPONS[code] });
      setCouponError('');
    } else {
      setAppliedCoupon(null);
      setCouponError('Invalid or expired coupon code.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const canCheckout = selectedRows.length > 0 && selectedState !== '' && agreeTerms;

  const handlePayNow = () => {
    if (!canCheckout) return;
    const modulesParam = selectedRows.map((r) => `${r.value}:${r.quantity}`).join(',');
    const params = new URLSearchParams({ modules: modulesParam, state: selectedState });
    if (appliedCoupon) params.set('coupon', appliedCoupon.code);
    params.set('discount', String(discountAmount));
    params.set('tax', String(totalTax));
    params.set('total', String(grandTotal));
    router.push(`/school/payment/checkout?${params.toString()}`);
  };

  const loading = modulesLoading || loadingPayments || loadingSubscriptions || status === 'loading';

  if (status === 'authenticated' && session?.user?.role !== 'schooladmin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-gray-800">Access Denied</p>
        <p className="mt-2 text-sm text-gray-500">Only school admins can access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Module Subscriptions */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Module Subscriptions</h1>
        <p className="mt-1 text-sm text-gray-500">Modules your school currently has access to.</p>
      </div>

      {subscriptions.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Expiration Date</th>
                  <th className="px-4 py-3">Purchased</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {subscriptions.map((sub) => {
                  const icon = MODULE_ICONS[sub.module_name] ?? 'star';
                  const expired = new Date(sub.expiry_date) < new Date();
                  return (
                    <tr key={sub.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                            <FiIcon name={icon} className="h-3.5 w-3.5 text-purple-600" />
                          </div>
                          <span className="font-medium text-gray-900">{sub.module_display}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {new Date(sub.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {sub.max_students !== null ? sub.max_students : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {sub.used_students}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {sub.remaining_students !== null ? sub.remaining_students : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            sub.is_active && !expired ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {sub.is_active && !expired ? 'Active' : expired ? 'Expired' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center">
          <p className="text-sm text-gray-500">No module subscriptions yet. Purchase modules below to get started.</p>
        </div>
      )}

      {/* Payment History */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Payment History</h2>
        <p className="mt-1 text-sm text-gray-500">All payments made by your school.</p>
      </div>

      {payments.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Modules</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Gateway</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {p.modules_purchased
                        .map((m) => m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
                        .join(', ')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      {p.currency === 'INR' ? '₹' : p.currency}{' '}
                      {Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.payment_gateway || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center">
          <p className="text-sm text-gray-500">No payments recorded yet.</p>
        </div>
      )}

      {/* Divider */}
      <hr className="border-neutral-200" />

      {/* Purchase New Modules */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Purchase New Modules</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set the number of students for each module you want to purchase.
        </p>
      </div>

      <div className="space-y-6">
        {/* Module line-item table */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="grid grid-cols-[1fr_100px_130px_100px] gap-4 border-b border-neutral-200 bg-neutral-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span>Module</span>
            <span className="text-right">Price</span>
            <span className="text-center">Students</span>
            <span className="text-right">Total</span>
          </div>
          {rows.map((row, idx) => {
            const isSelected = row.quantity > 0;
            return (
              <div
                key={row.value}
                className={`grid grid-cols-[1fr_100px_130px_100px] gap-4 items-center px-5 py-4 transition-colors ${
                  idx !== rows.length - 1 ? 'border-b border-neutral-100' : ''
                } ${isSelected ? 'bg-purple-50' : 'hover:bg-neutral-50'}`}
              >
                <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                  {row.label}
                </span>
                <span className="text-right text-sm text-gray-600">₹{MODULE_PRICE_INR}</span>
                <div className="flex justify-center">
                  <select
                    value={row.quantity}
                    onChange={(e) => setQuantity(row.value, Number(e.target.value))}
                    className="w-20 cursor-pointer rounded-lg border border-neutral-200 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  >
                    {Array.from({ length: 201 }, (_, i) => i).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <span className={`text-right text-sm font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                  {isSelected ? `₹${MODULE_PRICE_INR * row.quantity}` : '—'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Order summary panel */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Subtotal{totalUnits > 0 ? ` (${totalUnits} student seat${totalUnits !== 1 ? 's' : ''})` : ''}
            </span>
            <span className="text-sm font-semibold text-gray-900">₹{subtotal}</span>
          </div>

          <div className="border-t border-neutral-100" />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Discount Coupon</label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
                <span className="text-sm font-medium text-green-700">
                  ✓ &ldquo;{appliedCoupon.code}&rdquo; — {appliedCoupon.discountPct}% off
                </span>
                <button
                  onClick={handleRemoveCoupon}
                  className="cursor-pointer text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="cursor-pointer rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
                >
                  Apply
                </button>
              </div>
            )}
            {couponError && <p className="mt-1.5 text-xs text-red-500">{couponError}</p>}
          </div>

          {appliedCoupon && discountAmount > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>Discount ({appliedCoupon.discountPct}%)</span>
              <span>−₹{discountAmount}</span>
            </div>
          )}

          <div className="border-t border-neutral-100" />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">State (for GST calculation)</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'maharashtra' as StateOption, label: 'Maharashtra', sub: '9% CGST + 9% SGST' },
                { value: 'rest_of_india' as StateOption, label: 'Rest of India', sub: '18% IGST' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedState(opt.value)}
                  className={`cursor-pointer rounded-lg border px-4 py-3 text-left transition ${
                    selectedState === opt.value
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-neutral-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <p className={`text-sm font-semibold ${selectedState === opt.value ? 'text-purple-700' : 'text-gray-800'}`}>
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {selectedState && taxableAmount > 0 && (
            <div className="space-y-2 rounded-lg bg-neutral-50 px-4 py-3">
              {selectedState === 'maharashtra' ? (
                <>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>CGST (9%)</span>
                    <span>₹{cgstAmount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>SGST (9%)</span>
                    <span>₹{sgstAmount}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>IGST (18%)</span>
                  <span>₹{igstAmount}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-xl font-bold text-purple-700">₹{grandTotal}</span>
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 accent-purple-600"
            />
            <span className="text-sm text-gray-600">
              I agree to the{' '}
              <a href="/terms" target="_blank" className="text-purple-600 underline hover:text-purple-700">
                Terms and Conditions
              </a>
            </span>
          </label>

          <button
            onClick={handlePayNow}
            disabled={!canCheckout}
            className="w-full cursor-pointer rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pay Now — ₹{grandTotal}
          </button>

          {selectedRows.length === 0 && (
            <p className="text-center text-xs text-gray-400">Select at least one module to continue.</p>
          )}
          {selectedRows.length > 0 && !selectedState && (
            <p className="text-center text-xs text-gray-400">Please select your state for tax calculation.</p>
          )}
          {selectedRows.length > 0 && selectedState && !agreeTerms && (
            <p className="text-center text-xs text-gray-400">Please agree to the Terms and Conditions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
