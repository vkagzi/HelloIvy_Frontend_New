'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useModuleChoices } from '@/lib/hooks/useModuleChoices';
import { useModuleAccess } from '@/app/_contexts/ModuleAccessContext';
import { FiIcon } from '@/app/_components/Icons';

// Price in INR per module — must match backend MODULE_PRICES
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

export default function PayAsStudentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { modules: moduleChoices, loading: modulesLoading } = useModuleChoices();
  const { modules: activeModules, loading: accessLoading } = useModuleAccess();
  const [cart, setCart] = React.useState<Set<string>>(new Set());


  const toggleCart = (value: string) => {
    setCart((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const cartModules = moduleChoices.filter((m) => cart.has(m.value));
  const total = cartModules.length * MODULE_PRICE_INR;

  const handleCheckout = () => {
    if (cart.size === 0) return;
    router.push(`/pay-as-student/checkout?modules=${Array.from(cart).join(',')}`);
  };

  const loading = modulesLoading || accessLoading || status === 'loading';

  if (status === 'authenticated' && session?.user?.school_id) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-gray-800">Contact your school for payment</p>
        <p className="mt-2 text-sm text-gray-500">Your school manages access to modules on your behalf.</p>
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
      <div>
        <h1 className="text-xl font-bold text-gray-900">Unlock Modules</h1>
        <p className="mt-1 text-sm text-gray-500">
          Each module is priced at <span className="font-semibold text-gray-700">₹{MODULE_PRICE_INR}</span>. Add the ones you want to your cart and check out.
        </p>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {moduleChoices.map((m) => {
          const isActive = activeModules.includes(m.value);
          const inCart = cart.has(m.value);
          const icon = MODULE_ICONS[m.value] ?? 'star';

          return (
            <div
              key={m.value}
              className={`relative flex flex-col rounded-xl border p-4 transition-all ${
                isActive
                  ? 'border-green-200 bg-green-50 opacity-70'
                  : inCart
                  ? 'border-purple-400 bg-purple-50 shadow-sm'
                  : 'border-neutral-200 bg-white hover:border-purple-300 hover:shadow-sm'
              }`}
            >
              {isActive && (
                <span className="absolute right-3 top-3 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  Active
                </span>
              )}
              {inCart && !isActive && (
                <span className="absolute right-3 top-3 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                  In Cart
                </span>
              )}

              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <FiIcon name={icon} className="h-5 w-5 text-purple-600" />
              </div>

              <p className="mb-1 text-sm font-semibold text-gray-900">{m.label}</p>
              <p className="mb-4 text-sm font-medium text-gray-500">₹{MODULE_PRICE_INR}</p>

              {isActive ? (
                <button
                  disabled
                  className="mt-auto rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 cursor-not-allowed"
                >
                  Already subscribed
                </button>
              ) : (
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
              )}
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
                {cart.size} module{cart.size !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-gray-500">
                {cartModules.map((m) => m.label).join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-base font-bold text-gray-900">₹{total}</p>
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
