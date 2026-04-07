'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';
import api from '@/lib/api-client';
import { FiIcon } from '@/app/_components/Icons';

const MODULE_PRICE_INR = 999;

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
  const [cart, setCart] = useState<Set<string>>(new Set());
  const [numStudents, setNumStudents] = useState<number>(1);
  const [totalStudents, setTotalStudents] = useState<number>(1);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [payments, setPayments] = useState<SchoolPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<ModuleSubscription[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  useEffect(() => {
    api<{ total_students: number }>('/api/accounts/school/checkout/')
      .then((data) => {
        const count = data.total_students || 1;
        setTotalStudents(count);
        setNumStudents(count);
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));

    api<{ payments: SchoolPayment[] }>('/api/accounts/school/payments/')
      .then((data) => setPayments(data.payments ?? []))
      .catch(() => {})
      .finally(() => setLoadingPayments(false));

    api<{ subscriptions: ModuleSubscription[] }>('/api/accounts/school/subscriptions/')
      .then((data) => setSubscriptions(data.subscriptions ?? []))
      .catch(() => {})
      .finally(() => setLoadingSubscriptions(false));
  }, []);

  const toggleCart = (value: string) => {
    setCart((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const cartModules = moduleChoices.filter((m) => cart.has(m.value));
  const pricePerStudent = cartModules.length * MODULE_PRICE_INR;
  const total = pricePerStudent * numStudents;

  const handleCheckout = () => {
    if (cart.size === 0 || numStudents < 1) return;
    router.push(
      `/school/payment/checkout?modules=${Array.from(cart).join(',')}&num_students=${numStudents}`
    );
  };

  const loading = modulesLoading || loadingStudents || loadingPayments || loadingSubscriptions || status === 'loading';

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-neutral-100" />
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subscriptions.map((sub) => {
            const icon = MODULE_ICONS[sub.module_name] ?? 'star';
            const expired = new Date(sub.expiry_date) < new Date();
            return (
              <div
                key={sub.id}
                className={`flex flex-col rounded-xl border p-4 ${
                  sub.is_active && !expired
                    ? 'border-green-200 bg-green-50'
                    : 'border-neutral-200 bg-neutral-50 opacity-60'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                    <FiIcon name={icon} className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{sub.module_display}</span>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <p>
                    Status:{' '}
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        sub.is_active && !expired ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {sub.is_active && !expired ? 'Active' : expired ? 'Expired' : 'Inactive'}
                    </span>
                  </p>
                  {sub.max_students && <p>Max Students: {sub.max_students}</p>}
                  <p>Expires: {new Date(sub.expiry_date).toLocaleDateString()}</p>
                  <p>Source: {sub.source}</p>
                </div>
              </div>
            );
          })}
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
          Each module is priced at{' '}
          <span className="font-semibold text-gray-700">₹{MODULE_PRICE_INR}</span> per student.
          Select modules and specify the number of students.
        </p>
      </div>

      {/* Number of students input */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Number of Students
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            value={numStudents}
            onChange={(e) => setNumStudents(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-10 w-40 rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
          <span className="text-xs text-gray-400">
            (Your school currently has {totalStudents} student{totalStudents !== 1 ? 's' : ''})
          </span>
        </div>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {moduleChoices.map((m) => {
          const inCart = cart.has(m.value);
          const icon = MODULE_ICONS[m.value] ?? 'star';

          return (
            <div
              key={m.value}
              className={`relative flex flex-col rounded-xl border p-4 transition-all ${
                inCart
                  ? 'border-purple-400 bg-purple-50 shadow-sm'
                  : 'border-neutral-200 bg-white hover:border-purple-300 hover:shadow-sm'
              }`}
            >
              {inCart && (
                <span className="absolute right-3 top-3 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                  In Cart
                </span>
              )}

              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <FiIcon name={icon} className="h-5 w-5 text-purple-600" />
              </div>

              <p className="mb-1 text-sm font-semibold text-gray-900">{m.label}</p>
              <p className="mb-4 text-sm font-medium text-gray-500">₹{MODULE_PRICE_INR} / student</p>

              <button
                onClick={() => toggleCart(m.value)}
                className={`mt-auto rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  inCart
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-neutral-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                }`}
              >
                {inCart ? 'Remove from cart' : 'Add to cart'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Cart summary bar */}
      {cart.size > 0 && (
        <div className="sticky bottom-4 z-10 mx-auto max-w-2xl">
          <div className="flex items-center justify-between rounded-xl border border-purple-200 bg-white px-5 py-4 shadow-lg">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {cart.size} module{cart.size !== 1 ? 's' : ''} × {numStudents} student{numStudents !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500">
                {cartModules.map((m) => m.label).join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-base font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</p>
              <button
                onClick={handleCheckout}
                className="cursor-pointer rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Proceed to Checkout →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
