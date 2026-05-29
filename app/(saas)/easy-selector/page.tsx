'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FiIcon } from '@/app/_components/Icons';
import { Heading, Label } from '@/app/_components/Typography';

export default function EasySelectorPage(): React.ReactElement {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please log in to access this module.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 mb-4"
          >
            <FiIcon name="angle-small-left" className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 shadow-sm">
              <FiIcon name="magic-wand" className="h-7 w-7 text-yellow-600" />
            </div>
            <div>
              <Heading level={2} className="text-gray-900">
                Easy Selector
              </Heading>
              <Label size="sm" className="text-gray-500 mt-1">
                Simplify your selection process
              </Label>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-2xl border border-yellow-100 bg-white shadow-sm p-8">
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="flex justify-center mb-6">
                <FiIcon name="star" className="h-16 w-16 text-yellow-500 opacity-80" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Welcome to Easy Selector
              </h2>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                This module helps you make smart decisions about your educational and career path with ease.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <FiIcon name="lightbulb" className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Personalized Guidance</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Get tailored recommendations based on your preferences and goals.
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <FiIcon name="chart-line" className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Smart Analytics</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Understand trends and insights to make informed decisions.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:scale-105"
              >
                <span>Return to Dashboard</span>
                <FiIcon name="angle-small-right" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 rounded-xl border border-yellow-100 bg-yellow-50 p-6">
          <div className="flex gap-3">
            <FiIcon name="info-circle" className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">Module Coming Soon</p>
              <p className="text-sm text-yellow-800 mt-1">
                This module is being enhanced with new features. Check back soon for more updates!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
