'use client';

import React from 'react';
import { FiIcon } from '@/app/_components/Icons';

export default function ResumeBuilderPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative mb-8">
        <div className="absolute -inset-4 rounded-full bg-pink-100/50 blur-xl animate-pulse" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-xl shadow-pink-200">
          <FiIcon name="file-invoice" className="h-12 w-12 text-white" />
        </div>
      </div>
      
      <h1 className="mb-3 text-3xl font-bold text-gray-900">Resume Builder</h1>
      <p className="max-w-md text-lg text-gray-500 leading-relaxed">
        Craft your professional story with our AI-powered resume builder. This feature is currently under active development.
      </p>
      
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl px-6">
        {[
          { label: 'AI Templates', icon: 'sr-apps' },
          { label: 'Smart Parsing', icon: 'brain-circuit' },
          { label: 'Export to PDF', icon: 'document' }
        ].map((feat) => (
          <div key={feat.label} className="flex flex-col items-center p-4 rounded-xl border border-neutral-100 bg-white shadow-sm">
            <FiIcon name={feat.icon} className="h-6 w-6 text-pink-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">{feat.label}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-12 rounded-full border border-pink-200 bg-pink-50 px-6 py-2">
        <span className="text-sm font-semibold text-pink-700">Coming July 2026</span>
      </div>
    </div>
  );
}
