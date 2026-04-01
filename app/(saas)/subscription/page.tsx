'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api-client';
import { useModuleAccess } from '@/app/_contexts/ModuleAccessContext';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';
import { FiIcon } from '@/app/_components/Icons';
import { useSession } from 'next-auth/react';

interface UserPayment {
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

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

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

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const isB2C = !session?.user?.school_id;
  const { modules: activeModules, loading: accessLoading } = useModuleAccess();
  const { modules: moduleChoices, loading: choicesLoading } = useModuleChoices();
  const [payments, setPayments] = useState<UserPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    if (!isB2C) {
      setPaymentsLoading(false);
      return;
    }
    api<{ payments: UserPayment[] }>('/api/accounts/me/payments/')
      .then((d) => setPayments(d.payments))
      .catch(() => {})
      .finally(() => setPaymentsLoading(false));
  }, [isB2C]);

  const labelFor = (value: string) =>
    moduleChoices.find((m) => m.value === value)?.label ??
    value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const loading = accessLoading || choicesLoading || paymentsLoading;

  return (
    <div className="space-y-8">
      {/* Active Modules */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Active Modules</h2>
          {isB2C && (
            <Link
              href="/pay-as-student"
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              + Unlock More
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : activeModules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-12 text-center">
            <p className="text-sm text-gray-500">No active modules yet.</p>
            {isB2C && (
              <Link href="/pay-as-student" className="mt-3 inline-block text-sm font-medium text-purple-600 hover:underline">
                Unlock your first module →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {activeModules.map((m) => (
              <div key={m} className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100">
                  <FiIcon name={MODULE_ICONS[m] ?? 'star'} className="h-4 w-4 text-green-700" />
                </div>
                <p className="text-sm font-medium text-gray-900">{labelFor(m)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payment History — only for B2C */}
      {isB2C && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-gray-900">Payment History</h2>

          {paymentsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-10 text-center">
              <p className="text-sm text-gray-500">No payment records yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Modules</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-gray-400">#{p.id}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {p.modules_purchased.map((m) => labelFor(m)).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        ₹{p.amount}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-800'}`}>
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
