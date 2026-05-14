'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';
import { useModuleAccess } from '@/app/_contexts/ModuleAccessContext';
import Link from 'next/link';

import api from '@/lib/api-client';

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

export interface ModuleSelectionConfig {
  mode: 'student' | 'school';
  /** Max quantity per module (student: 10, school: 200) */
  maxQuantity: number;
  /** Column header for quantity (e.g. "Quantity" or "Students") */
  quantityLabel: string;
  /** Unit label for subtotal (e.g. "unit" or "student seat") */
  unitLabel: string;
  /** Where the "Pay Now" button redirects */
  checkoutUrl: string;
  /** Optional back link */
  backLink?: { href: string; label: string };
  /** Page title */
  title: string;
  /** Page subtitle */
  subtitle: string;
  /** Show active module badges (student mode) */
  showActiveModules?: boolean;
  /** Restore state from URL search params (student mode) */
  restoreFromUrl?: boolean;
}

export default function ModuleSelectionForm({ config }: { config: ModuleSelectionConfig }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { modules: moduleChoices, loading: modulesLoading, getPrice, currency: priceCurrency } = useModuleChoices();
  const { modules: activeModules, loading: accessLoading } = useModuleAccess();

  const [rows, setRows] = useState<ModuleRow[]>([]);
  const [selectedState, setSelectedState] = useState<StateOption | ''>('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Coupon States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    isFlat: boolean;
    discountPct?: number;
    discountAmount?: number;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (moduleChoices.length === 0) return;

    if (config.restoreFromUrl) {
      // Parse quantities from URL params (set when returning from checkout)
      const modulesParam = searchParams?.get('modules') ?? '';
      const quantityMap: Record<string, number> = {};
      modulesParam
        .split(',')
        .filter(Boolean)
        .forEach((entry) => {
          const [mod, qtyStr] = entry.split(':');
          quantityMap[mod] = Math.max(0, Math.min(config.maxQuantity, parseInt(qtyStr ?? '1', 10) || 1));
        });

      setRows(
        moduleChoices.map((m) => ({
          value: m.value,
          label: m.label,
          quantity: quantityMap[m.value] ?? 0,
        })),
      );

      // Restore state selection
      const stateParam = searchParams?.get('state');
      if (stateParam === 'maharashtra' || stateParam === 'rest_of_india') {
        setSelectedState(stateParam);
      }


    } else {
      setRows(moduleChoices.map((m) => ({ value: m.value, label: m.label, quantity: 0 })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleChoices]);

  const setQuantity = (value: string, quantity: number) =>
    setRows((prev) => prev.map((r) => (r.value === value ? { ...r, quantity } : r)));

  const selectedRows = rows.filter((r) => r.quantity > 0);
  const totalUnits = selectedRows.reduce((s, r) => s + r.quantity, 0);
  const subtotal = selectedRows.reduce((s, r) => s + getPrice(r.value) * r.quantity, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.isFlat && appliedCoupon.discountAmount) {
      discountAmount = appliedCoupon.discountAmount;
    } else if (!appliedCoupon.isFlat && appliedCoupon.discountPct) {
      discountAmount = (subtotal * appliedCoupon.discountPct) / 100;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const formatCurrency = (num: number) => {
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const taxableAmount = subtotal - discountAmount;

  const taxes = selectedState ? TAX_CONFIG[selectedState] : { cgst: 0, sgst: 0, igst: 0 };
  const cgstAmount = (taxableAmount * taxes.cgst) / 100;
  const sgstAmount = (taxableAmount * taxes.sgst) / 100;
  const igstAmount = (taxableAmount * taxes.igst) / 100;
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const grandTotal = taxableAmount + totalTax;



  const canCheckout = selectedRows.length > 0 && selectedState !== '' && agreeTerms;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;

    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await api<{
        valid: boolean;
        code: string;
        voucher_type: string;
        voucher_value: number;
        min_booking_amount?: number;
      }>('/api/accounts/coupons/validate/', {
        method: 'POST',
        body: { code, amount: subtotal },
      });

      const isFlat = res.voucher_type === 'flat';
      setAppliedCoupon({
        code: res.code,
        isFlat,
        discountPct: !isFlat ? res.voucher_value : undefined,
        discountAmount: isFlat ? res.voucher_value : undefined,
        minAmount: res.min_booking_amount
      });
      setCouponInput(res.code);
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handlePayNow = () => {
    if (!canCheckout) return;
    const modulesParam = selectedRows.map((r) => `${r.value}:${r.quantity}`).join(',');
    const params = new URLSearchParams({ modules: modulesParam, state: selectedState });
    if (appliedCoupon) params.set('coupon_code', appliedCoupon.code);
    params.set('discount', String(discountAmount));
    params.set('tax', String(totalTax));
    params.set('total', String(grandTotal));
    router.push(`${config.checkoutUrl}?${params.toString()}`);
  };

  const loading = modulesLoading || (config.showActiveModules ? accessLoading : false) || status === 'loading';

  // Access-denied guard for student mode (school admins can't buy as student)
  if (config.mode === 'student' && status === 'authenticated' && session?.user?.school_id) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-gray-800">Contact your school for payment</p>
        <p className="mt-2 text-sm text-gray-500">Your school manages access to modules on your behalf.</p>
      </div>
    );
  }

  // Access-denied guard for school mode (only schooladmin)
  if (config.mode === 'school' && status === 'authenticated' && session?.user?.role !== 'schooladmin') {
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
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Optional back link */}
      {config.backLink && (
        <div>
          <Link href={config.backLink.href} className="text-sm text-purple-600 hover:underline">
            ← {config.backLink.label}
          </Link>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{config.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{config.subtitle}</p>
      </div>

      {/* Module line-item table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_100px_130px_100px] gap-4 border-b border-neutral-200 bg-neutral-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <span>Module</span>
          <span className="text-right">Price</span>
          <span className="text-center">{config.quantityLabel}</span>
          <span className="text-right">Total</span>
        </div>

        {/* Table rows */}
        {rows.map((row, idx) => {
          const isActive = config.showActiveModules && activeModules.includes(row.value);
          const isSelected = row.quantity > 0;
          return (
            <div
              key={row.value}
              className={`grid grid-cols-[1fr_100px_130px_100px] gap-4 items-center px-5 py-4 transition-colors ${idx !== rows.length - 1 ? 'border-b border-neutral-100' : ''
                } ${isActive && !isSelected ? 'bg-green-50' : isSelected ? 'bg-purple-50' : 'hover:bg-neutral-50'}`}
            >
              {/* Module name */}
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-sm font-medium ${isActive && !isSelected ? 'text-gray-500' : 'text-gray-900'}`}>
                  {row.label}
                </span>
                {isActive && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    Active
                  </span>
                )}
              </div>

              {/* Unit price */}
              <span className="text-right text-sm text-gray-600">₹{getPrice(row.value)}</span>

              {/* Quantity selector */}
              <div className="flex justify-center">
                <select
                  value={row.quantity}
                  onChange={(e) => setQuantity(row.value, Number(e.target.value))}
                  className="w-20 cursor-pointer rounded-lg border border-neutral-200 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  {Array.from({ length: config.maxQuantity + 1 }, (_, i) => i).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Line total */}
              <span className={`text-right text-sm font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                {isSelected ? `₹${getPrice(row.value) * row.quantity}` : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Order summary panel */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-5">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Subtotal{totalUnits > 0 ? ` (${totalUnits} ${config.unitLabel}${totalUnits !== 1 ? 's' : ''})` : ''}
          </span>
          <span className="text-sm font-semibold text-gray-900">₹{subtotal}</span>
        </div>

        <div className="border-t border-neutral-100" />

        {/* Coupon Input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Coupon Code</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                disabled={!!appliedCoupon || subtotal === 0}
                className="w-full rounded-lg border border-neutral-200 px-4 py-2 text-sm tracking-wider focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:bg-neutral-50 disabled:text-neutral-500 font-mono"
              />
              {appliedCoupon && (
                <button
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponInput('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-neutral-100 p-1 text-neutral-400 hover:text-red-500 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              )}
            </div>
            {!appliedCoupon && (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={!couponInput || validatingCoupon || subtotal === 0}
                className="rounded-lg bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-600 border border-purple-100 hover:bg-purple-100 disabled:opacity-50 transition"
              >
                {validatingCoupon ? '...' : 'Apply'}
              </button>
            )}
          </div>
          {couponError && <p className="mt-1 text-xs text-red-500">{couponError}</p>}
          {appliedCoupon && (
            <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              Coupon applied! {appliedCoupon.isFlat ? `₹${appliedCoupon.discountAmount} off` : `${appliedCoupon.discountPct}% off`}
            </p>
          )}
        </div>

        <div className="border-t border-neutral-100" />

        {/* State selection */}
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
                className={`cursor-pointer rounded-lg border px-4 py-3 text-left transition ${selectedState === opt.value
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

        {/* Tax breakdown */}
        {selectedState && taxableAmount > 0 && (
          <div className="space-y-2 rounded-lg bg-neutral-50 px-4 py-3">
            {appliedCoupon && (
              <div className="flex items-center justify-between text-sm text-green-600 font-medium">
                <span>Coupon Discount</span>
                <span>- ₹{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {selectedState === 'maharashtra' ? (
              <>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>CGST (9%)</span>
                  <span>₹{formatCurrency(cgstAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>SGST (9%)</span>
                  <span>₹{formatCurrency(sgstAmount)}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>IGST (18%)</span>
                <span>₹{formatCurrency(igstAmount)}</span>
              </div>
            )}
          </div>
        )}

        {/* Grand total */}
        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <span className="text-base font-semibold text-gray-900">Total</span>
          <span className="text-xl font-bold text-purple-700">₹{formatCurrency(grandTotal)}</span>
        </div>

        {/* Terms & Conditions */}
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

        {/* Pay Now */}
        <button
          onClick={handlePayNow}
          disabled={!canCheckout}
          className="w-full cursor-pointer rounded-lg bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pay Now — ₹{formatCurrency(grandTotal)}
        </button>

        {/* Inline hints */}
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
  );
}
