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

// GPT-5.2 pricing per 1M tokens (in USD)
const PRICING = {
  input: 1.75, // $1.750 per 1M tokens
  cached: 0.175, // $0.175 per 1M tokens
  output: 14.0, // $14.000 per 1M tokens
  reasoning: 14.0, // Same as output tokens for reasoning models
} as const;

function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null) return '0';
  return n.toLocaleString();
}

function formatCost(tokens: number, pricePerMillion: number): number {
  return (tokens / 1_000_000) * pricePerMillion;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

function calculateTotalCost(tokenUsage: TokenUsageData): number {
  const inputCost = formatCost(
    tokenUsage.total_input_tokens ?? 0,
    PRICING.input
  );
  const outputCost = formatCost(
    tokenUsage.total_output_tokens ?? 0,
    PRICING.output
  );
  const cachedCost = formatCost(
    tokenUsage.total_cache_read_tokens ?? 0,
    PRICING.cached
  );
  const reasoningCost = formatCost(
    tokenUsage.total_reasoning_tokens ?? 0,
    PRICING.reasoning
  );

  return inputCost + outputCost + cachedCost + reasoningCost;
}

function calculateCategoryCost(category: CategoryUsage): number {
  const inputCost = formatCost(category.input_tokens, PRICING.input);
  const outputCost = formatCost(category.output_tokens, PRICING.output);
  const cachedCost = formatCost(
    category.cache_read_tokens ?? 0,
    PRICING.cached
  );
  const reasoningCost = formatCost(
    category.reasoning_tokens ?? 0,
    PRICING.reasoning
  );

  return inputCost + outputCost + cachedCost + reasoningCost;
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
      <div className="rounded bg-gray-50 p-4 text-center">
        <p className="text-xs text-gray-500">
          No token usage data recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Totals Summary */}
      <div className="rounded bg-gray-50 p-2">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          Session Totals
        </h3>
        <div className="grid grid-cols-4 gap-2 text-sm sm:grid-cols-7">
          <div className="rounded bg-white p-2 shadow-sm">
            <p className="font-medium text-gray-500">Total</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">
              {formatNumber(tokenUsage.total_tokens)}
            </p>
          </div>
          <div className="rounded bg-white p-2 shadow-sm">
            <p className="font-medium text-gray-500">Input</p>
            <p className="mt-0.5 text-lg font-bold text-blue-600">
              {formatNumber(tokenUsage.total_input_tokens)}
            </p>
          </div>
          <div className="rounded bg-white p-2 shadow-sm">
            <p className="font-medium text-gray-500">Output</p>
            <p className="mt-0.5 text-lg font-bold text-green-600">
              {formatNumber(tokenUsage.total_output_tokens)}
            </p>
          </div>
          <div className="rounded bg-white p-2 shadow-sm">
            <p className="font-medium text-gray-500">Calls</p>
            <p className="mt-0.5 text-lg font-bold text-purple-600">
              {formatNumber(tokenUsage.total_llm_calls)}
            </p>
          </div>
          <div className="rounded bg-white p-2 shadow-sm">
            <p className="font-medium text-gray-500">Cache</p>
            <p className="mt-0.5 text-lg font-bold text-amber-600">
              {formatNumber(tokenUsage.total_cache_read_tokens)}
            </p>
          </div>
          <div className="rounded bg-white p-2 shadow-sm">
            <p className="font-medium text-gray-500">Reasoning</p>
            <p className="mt-0.5 text-lg font-bold text-rose-600">
              {formatNumber(tokenUsage.total_reasoning_tokens)}
            </p>
          </div>
          <div className="rounded border border-indigo-300 bg-indigo-50 p-2 shadow-sm">
            <p className="font-medium text-indigo-700">Cost</p>
            <p className="mt-0.5 text-lg font-bold text-indigo-900">
              {formatCurrency(calculateTotalCost(tokenUsage))}
            </p>
          </div>
        </div>
      </div>

      {/* Per-Category Breakdown */}
      <div className="rounded bg-gray-50 p-2">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          Per-Category Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-1 pr-2 text-left font-medium text-gray-700">
                  Category
                </th>
                <th className="px-2 py-1 text-right font-medium text-gray-700">
                  Calls
                </th>
                <th className="px-2 py-1 text-right font-medium text-blue-700">
                  Input
                </th>
                <th className="px-2 py-1 text-right font-medium text-green-700">
                  Output
                </th>
                <th className="px-2 py-1 text-right font-medium text-gray-700">
                  Total
                </th>
                <th className="px-2 py-1 text-right font-medium text-amber-700">
                  Cached
                </th>
                <th className="px-2 py-1 text-right font-medium text-rose-700">
                  Reasoning
                </th>
                <th className="px-2 py-1 text-right font-medium text-indigo-700">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(categories).map(([name, cat]) => (
                <tr key={name} className="border-b border-gray-100">
                  <td className="py-1 pr-2 font-medium text-gray-900">
                    {formatCategoryName(name)}
                  </td>
                  <td className="px-2 py-1 text-right text-gray-600">
                    {formatNumber(cat.call_count)}
                  </td>
                  <td className="px-2 py-1 text-right text-blue-600">
                    {formatNumber(cat.input_tokens)}
                  </td>
                  <td className="px-2 py-1 text-right text-green-600">
                    {formatNumber(cat.output_tokens)}
                  </td>
                  <td className="px-2 py-1 text-right font-medium text-gray-900">
                    {formatNumber(cat.total_tokens)}
                  </td>
                  <td className="px-2 py-1 text-right text-amber-600">
                    {formatNumber(cat.cache_read_tokens)}
                  </td>
                  <td className="px-2 py-1 text-right text-rose-600">
                    {formatNumber(cat.reasoning_tokens)}
                  </td>
                  <td className="px-2 py-1 text-right font-semibold text-indigo-600">
                    {formatCurrency(calculateCategoryCost(cat))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-bold">
                <td className="py-1 pr-2 text-gray-900">Total</td>
                <td className="px-2 py-1 text-right text-gray-900">
                  {formatNumber(tokenUsage.total_llm_calls)}
                </td>
                <td className="px-2 py-1 text-right text-blue-700">
                  {formatNumber(tokenUsage.total_input_tokens)}
                </td>
                <td className="px-2 py-1 text-right text-green-700">
                  {formatNumber(tokenUsage.total_output_tokens)}
                </td>
                <td className="px-2 py-1 text-right text-gray-900">
                  {formatNumber(tokenUsage.total_tokens)}
                </td>
                <td className="px-2 py-1 text-right text-amber-700">
                  {formatNumber(tokenUsage.total_cache_read_tokens)}
                </td>
                <td className="px-2 py-1 text-right text-rose-700">
                  {formatNumber(tokenUsage.total_reasoning_tokens)}
                </td>
                <td className="px-2 py-1 text-right text-indigo-900">
                  {formatCurrency(calculateTotalCost(tokenUsage))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
