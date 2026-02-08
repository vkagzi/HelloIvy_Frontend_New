'use client';

import React from 'react';

interface CategoryUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  call_count: number;
  cache_read_tokens?: number;
  cache_creation_tokens?: number;
  reasoning_tokens?: number;
}

interface TokenUsageData {
  categories?: Record<string, CategoryUsage>;
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_tokens?: number;
  total_llm_calls?: number;
  total_cache_read_tokens?: number;
  total_cache_creation_tokens?: number;
  total_reasoning_tokens?: number;
}

interface TokenUsagePanelProps {
  tokenUsage: TokenUsageData;
}

function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null) return '0';
  return n.toLocaleString();
}

function formatCategoryName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c): string => c.toUpperCase());
}

export function TokenUsagePanel({
  tokenUsage,
}: TokenUsagePanelProps): React.ReactElement {
  const categories = tokenUsage?.categories || {};
  const hasData = tokenUsage?.total_llm_calls && tokenUsage.total_llm_calls > 0;

  if (!hasData) {
    return (
      <div className="rounded-lg bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">
          No token usage data recorded yet. Token usage will appear here after
          LLM calls are made during the session.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Totals Summary */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">
          Session Totals
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-md bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Total Tokens</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatNumber(tokenUsage.total_tokens)}
            </p>
          </div>
          <div className="rounded-md bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Input Tokens</p>
            <p className="mt-1 text-xl font-bold text-blue-600">
              {formatNumber(tokenUsage.total_input_tokens)}
            </p>
          </div>
          <div className="rounded-md bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Output Tokens</p>
            <p className="mt-1 text-xl font-bold text-green-600">
              {formatNumber(tokenUsage.total_output_tokens)}
            </p>
          </div>
          <div className="rounded-md bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">LLM Calls</p>
            <p className="mt-1 text-xl font-bold text-purple-600">
              {formatNumber(tokenUsage.total_llm_calls)}
            </p>
          </div>
        </div>

        {/* Cache & Reasoning Row */}
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-md bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Cache Read</p>
            <p className="mt-1 text-lg font-bold text-amber-600">
              {formatNumber(tokenUsage.total_cache_read_tokens)}
            </p>
          </div>
          <div className="rounded-md bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Cache Creation</p>
            <p className="mt-1 text-lg font-bold text-amber-600">
              {formatNumber(tokenUsage.total_cache_creation_tokens)}
            </p>
          </div>
          <div className="rounded-md bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">
              Reasoning Tokens
            </p>
            <p className="mt-1 text-lg font-bold text-rose-600">
              {formatNumber(tokenUsage.total_reasoning_tokens)}
            </p>
          </div>
        </div>
      </div>

      {/* Per-Category Breakdown */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">
          Per-Category Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-4 text-left font-medium text-gray-700">
                  Category
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">
                  Calls
                </th>
                <th className="px-3 py-2 text-right font-medium text-blue-700">
                  Input
                </th>
                <th className="px-3 py-2 text-right font-medium text-green-700">
                  Output
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">
                  Total
                </th>
                <th className="px-3 py-2 text-right font-medium text-amber-700">
                  Cached
                </th>
                <th className="px-3 py-2 text-right font-medium text-rose-700">
                  Reasoning
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(categories).map(([name, cat]) => (
                <tr key={name} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-900">
                    {formatCategoryName(name)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">
                    {formatNumber(cat.call_count)}
                  </td>
                  <td className="px-3 py-2 text-right text-blue-600">
                    {formatNumber(cat.input_tokens)}
                  </td>
                  <td className="px-3 py-2 text-right text-green-600">
                    {formatNumber(cat.output_tokens)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">
                    {formatNumber(cat.total_tokens)}
                  </td>
                  <td className="px-3 py-2 text-right text-amber-600">
                    {formatNumber(cat.cache_read_tokens)}
                  </td>
                  <td className="px-3 py-2 text-right text-rose-600">
                    {formatNumber(cat.reasoning_tokens)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-bold">
                <td className="py-2 pr-4 text-gray-900">Total</td>
                <td className="px-3 py-2 text-right text-gray-900">
                  {formatNumber(tokenUsage.total_llm_calls)}
                </td>
                <td className="px-3 py-2 text-right text-blue-700">
                  {formatNumber(tokenUsage.total_input_tokens)}
                </td>
                <td className="px-3 py-2 text-right text-green-700">
                  {formatNumber(tokenUsage.total_output_tokens)}
                </td>
                <td className="px-3 py-2 text-right text-gray-900">
                  {formatNumber(tokenUsage.total_tokens)}
                </td>
                <td className="px-3 py-2 text-right text-amber-700">
                  {formatNumber(tokenUsage.total_cache_read_tokens)}
                </td>
                <td className="px-3 py-2 text-right text-rose-700">
                  {formatNumber(tokenUsage.total_reasoning_tokens)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
