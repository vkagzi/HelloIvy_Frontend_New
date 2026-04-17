'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import api from '@/lib/api-client';
import { useModuleAccess } from '@/app/_contexts/ModuleAccessContext';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';
import { FiIcon } from '@/app/_components/Icons';

/* ─── shared constants ──────────────────────────────────────── */

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

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

/* ─── types ─────────────────────────────────────────────────── */

export interface SchoolSubscription {
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

export interface UserSubscription {
  id: number;
  module_name: string;
  module_display: string;
  expiry_date: string;
  is_active: boolean;
  source: string;
  created_at: string;
}

export interface Payment {
  id: number;
  modules_purchased: string[];
  amount: string;
  currency: string;
  status: string;
  payment_gateway: string;
  gateway_transaction_id: string;
  notes: string;
  created_at: string;
}

/* ─── props ─────────────────────────────────────────────────── */

interface SchoolModeProps {
  mode: 'school';
  /** URL the "Unlock More" / purchase link points to */
  purchaseHref?: string;
}

interface B2CModeProps {
  mode: 'b2c';
  purchaseHref?: string;
}

export type ModuleSubscriptionsProps = SchoolModeProps | B2CModeProps;

/* ─── skeletons ─────────────────────────────────────────────── */

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-100" />
      ))}
    </div>
  );
}

function SkeletonCards({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-100" />
      ))}
    </div>
  );
}

/* ─── sub-components ────────────────────────────────────────── */

interface LockedModule {
  value: string;
  label: string;
}

function SchoolSubscriptionsTable({
  subscriptions,
  loading,
  lockedModules,
  purchaseHref,
}: {
  subscriptions: SchoolSubscription[];
  loading: boolean;
  lockedModules: LockedModule[];
  purchaseHref: string;
}) {
  if (loading) return <SkeletonRows count={4} />;

  const hasRows = subscriptions.length > 0 || lockedModules.length > 0;

  if (!hasRows) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center">
        <p className="text-sm text-gray-500">No module subscriptions yet. Purchase modules below to get started.</p>
      </div>
    );
  }

  return (
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
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {subscriptions.filter((sub) => sub.is_active).map((sub) => {
              const icon = MODULE_ICONS[sub.module_name] ?? 'star';
              return (
                <tr key={sub.module_name} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                        <FiIcon name={icon} className="h-3.5 w-3.5 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-900">{sub.module_display}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {new Date(sub.expiry_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {sub.max_students !== null ? sub.max_students : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{sub.used_students}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {sub.remaining_students !== null ? sub.remaining_students : '—'}
                  </td>
                </tr>
              );
            })}
            {lockedModules.map((m) => {
              const icon = MODULE_ICONS[m.value] ?? 'star';
              return (
                <tr key={m.value} className="bg-neutral-50/60 opacity-75">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <FiIcon name={icon} className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-400">{m.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">—</td>
                  <td className="px-4 py-3 text-gray-400">—</td>
                  <td className="px-4 py-3 text-gray-400">—</td>
                  <td className="px-4 py-3 text-gray-400">—</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function B2CSubscriptionsTable({
  subscriptions,
  loading,
  lockedModules,
  purchaseHref,
}: {
  subscriptions: UserSubscription[];
  loading: boolean;
  lockedModules: LockedModule[];
  purchaseHref: string;
}) {
  if (loading) return <SkeletonRows count={4} />;

  const hasRows = subscriptions.length > 0 || lockedModules.length > 0;

  if (!hasRows) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center">
        <p className="text-sm text-gray-500">No module subscriptions yet. Purchase modules below to get started.</p>
      </div>
    );
  }

  return (
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
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {subscriptions.filter((sub) => sub.is_active).map((sub) => {
              const icon = MODULE_ICONS[sub.module_name] ?? 'star';
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
                    {new Date(sub.expiry_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-gray-700">—</td>
                  <td className="px-4 py-3 text-gray-700">—</td>
                  <td className="px-4 py-3 text-gray-700">—</td>
                </tr>
              );
            })}
            {lockedModules.map((m) => {
              const icon = MODULE_ICONS[m.value] ?? 'star';
              return (
                <tr key={m.value} className="bg-neutral-50/60 opacity-75">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <FiIcon name={icon} className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-400">{m.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">—</td>
                  <td className="px-4 py-3 text-gray-400">—</td>
                  <td className="px-4 py-3 text-gray-400">—</td>
                  <td className="px-4 py-3 text-gray-400">—</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentHistoryTable({
  payments,
  loading,
  labelFor,
  showGateway,
}: {
  payments: Payment[];
  loading: boolean;
  labelFor: (value: string) => string;
  showGateway?: boolean;
}) {
  if (loading) return <SkeletonRows count={3} />;

  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center">
        <p className="text-sm text-gray-500">No payments recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Modules</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              {showGateway && <th className="px-4 py-3">Gateway</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-50">
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {p.modules_purchased.map((m) => labelFor(m)).join(', ') || '—'}
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
                {showGateway && (
                  <td className="px-4 py-3 text-gray-500">{p.payment_gateway || '—'}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── main component ────────────────────────────────────────── */

export default function ModuleSubscriptions(props: ModuleSubscriptionsProps) {
  const { mode, purchaseHref } = props;
  const isSchool = mode === 'school';

  const { modules: moduleChoices, loading: choicesLoading } = useModuleChoices();
  const { modules: activeModules, loading: accessLoading } = useModuleAccess();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  const [subscriptions, setSubscriptions] = useState<SchoolSubscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(isSchool);

  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [userSubsLoading, setUserSubsLoading] = useState(!isSchool);

  /* fetch data based on mode */
  useEffect(() => {
    const paymentsUrl = isSchool
      ? '/api/accounts/school/payments/'
      : '/api/accounts/me/payments/';

    api<{ payments: Payment[] }>(paymentsUrl)
      .then((d) => setPayments(d.payments ?? []))
      .catch(() => {})
      .finally(() => setPaymentsLoading(false));

    if (isSchool) {
      api<{ subscriptions: SchoolSubscription[] }>('/api/accounts/school/subscriptions/')
        .then((d) => setSubscriptions(d.subscriptions ?? []))
        .catch(() => {})
        .finally(() => setSubscriptionsLoading(false));
    } else {
      api<{ subscriptions: UserSubscription[] }>('/api/accounts/me/subscriptions/')
        .then((d) => setUserSubscriptions(d.subscriptions ?? []))
        .catch(() => {})
        .finally(() => setUserSubsLoading(false));
    }
  }, [isSchool]);

  const labelFor = (value: string) =>
    moduleChoices.find((m) => m.value === value)?.label ??
    value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const inactiveModules = moduleChoices
    .filter((m) => !activeModules.includes(m.value))
    .sort((a, b) => a.label.localeCompare(b.label));

  const loading = choicesLoading || paymentsLoading || (isSchool ? subscriptionsLoading : userSubsLoading);

  if (loading) return <SkeletonRows count={6} />;

  const defaultPurchaseHref = isSchool ? '/school/payment' : '/pay-as-student';
  const href = purchaseHref ?? defaultPurchaseHref;

  return (
    <div className="space-y-8">
      {/* Subscriptions / Active modules */}
      {isSchool ? (
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Module Subscriptions</h2>
            <p className="mt-1 text-sm text-gray-500">Modules your school currently has access to.</p>
          </div>
          <SchoolSubscriptionsTable subscriptions={[...subscriptions].sort((a, b) => a.module_display.localeCompare(b.module_display))} loading={false} lockedModules={inactiveModules} purchaseHref={href} />
        </section>
      ) : (
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Module Subscriptions</h2>
            <p className="mt-1 text-sm text-gray-500">Your module access overview.</p>
          </div>
          <B2CSubscriptionsTable subscriptions={[...userSubscriptions].sort((a, b) => a.module_display.localeCompare(b.module_display))} loading={false} lockedModules={inactiveModules} purchaseHref={href} />
        </section>
      )}

      {/* Payment History */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">Payment History</h2>
          <p className="mt-1 text-sm text-gray-500">
            {isSchool ? 'All payments made by your school.' : 'Your payment records.'}
          </p>
        </div>
        <PaymentHistoryTable
          payments={payments}
          loading={false}
          labelFor={labelFor}
          showGateway={isSchool}
        />
      </section>
    </div>
  );
}
