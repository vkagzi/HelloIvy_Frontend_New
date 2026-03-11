'use client';

import React from 'react';
import type { RealtimeTokenUsage } from '@/lib/realtime-voice-client';

// Azure OpenAI Realtime API pricing per 1M tokens (in USD)
// gpt-4o-realtime: text input $5, text output $20, audio input $100, audio output $200
const REALTIME_PRICING = {
  text_input: 4.0,
  text_output: 16.0,
  audio_input: 32.0,
  audio_output: 64.0,
  cached_text_input: 0.4,
  cached_audio_input: 0.4,
} as const;

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatCost(tokens: number, pricePerMillion: number): number {
  return (tokens / 1_000_000) * pricePerMillion;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

function calculateRealtimeCost(usage: RealtimeTokenUsage): number {
  const textInputCost = formatCost(usage.input_text_tokens, REALTIME_PRICING.text_input);
  const audioInputCost = formatCost(usage.input_audio_tokens, REALTIME_PRICING.audio_input);
  const textOutputCost = formatCost(usage.output_text_tokens, REALTIME_PRICING.text_output);
  const audioOutputCost = formatCost(usage.output_audio_tokens, REALTIME_PRICING.audio_output);
  const cachedCost = formatCost(usage.input_cached_tokens, REALTIME_PRICING.cached_text_input);
  return textInputCost + audioInputCost + textOutputCost + audioOutputCost + cachedCost;
}

interface SavedRealtimeVoiceCategory {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  call_count?: number;
  input_text_tokens?: number;
  input_audio_tokens?: number;
  output_text_tokens?: number;
  output_audio_tokens?: number;
  input_cached_tokens?: number;
  response_count?: number;
}

interface RealtimeTokenUsagePanelProps {
  /** Live client-side accumulated usage from current voice session */
  tokenUsage: RealtimeTokenUsage | null | undefined;
  /** Persisted usage from DB (token_usage.categories.realtime_voice) from previous sessions */
  savedTokenUsage?: SavedRealtimeVoiceCategory | null;
}

function mergeUsage(
  live: RealtimeTokenUsage | null | undefined,
  saved: SavedRealtimeVoiceCategory | null | undefined,
): RealtimeTokenUsage | null {
  if (!live && !saved) return null;
  return {
    total_tokens: (live?.total_tokens ?? 0) + (saved?.total_tokens ?? 0),
    input_tokens: (live?.input_tokens ?? 0) + (saved?.input_tokens ?? 0),
    output_tokens: (live?.output_tokens ?? 0) + (saved?.output_tokens ?? 0),
    input_text_tokens: (live?.input_text_tokens ?? 0) + (saved?.input_text_tokens ?? 0),
    input_audio_tokens: (live?.input_audio_tokens ?? 0) + (saved?.input_audio_tokens ?? 0),
    output_text_tokens: (live?.output_text_tokens ?? 0) + (saved?.output_text_tokens ?? 0),
    output_audio_tokens: (live?.output_audio_tokens ?? 0) + (saved?.output_audio_tokens ?? 0),
    input_cached_tokens: (live?.input_cached_tokens ?? 0) + (saved?.input_cached_tokens ?? 0),
    response_count: (live?.response_count ?? 0) + (saved?.response_count ?? saved?.call_count ?? 0),
  };
}

export function RealtimeTokenUsagePanel({
  tokenUsage,
  savedTokenUsage,
}: RealtimeTokenUsagePanelProps): React.ReactElement {
  const merged = mergeUsage(tokenUsage, savedTokenUsage);

  if (!merged || merged.response_count === 0) {
    return (
      <div className="rounded bg-gray-50 p-4 text-center">
        <p className="text-xs text-gray-500">
          No realtime voice token usage recorded yet. Start a voice session to see usage data.
        </p>
      </div>
    );
  }

  const totalCost = calculateRealtimeCost(merged);

  return (
    <div className="space-y-2">
      {/* Totals Summary */}
      <div className="rounded bg-gray-50 p-2">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          Realtime Voice Session Totals
        </h3>
        <div className="grid grid-cols-4 gap-2 text-sm sm:grid-cols-5">
          <div className="rounded bg-white p-2 shadow-sm">
            <p className="font-medium text-gray-500">Total</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">
              {formatNumber(merged.total_tokens)}
            </p>
          </div>
          <div className="rounded bg-white p-2 shadow-sm">
            <p className="font-medium text-gray-500">Input</p>
            <p className="mt-0.5 text-lg font-bold text-blue-600">
              {formatNumber(merged.input_tokens)}
            </p>
          </div>
          <div className="rounded bg-white p-2 shadow-sm">
            <p className="font-medium text-gray-500">Output</p>
            <p className="mt-0.5 text-lg font-bold text-green-600">
              {formatNumber(merged.output_tokens)}
            </p>
          </div>
          <div className="rounded bg-white p-2 shadow-sm">
            <p className="font-medium text-gray-500">Responses</p>
            <p className="mt-0.5 text-lg font-bold text-purple-600">
              {formatNumber(merged.response_count)}
            </p>
          </div>
          <div className="rounded border border-indigo-300 bg-indigo-50 p-2 shadow-sm">
            <p className="font-medium text-indigo-700">Est. Cost</p>
            <p className="mt-0.5 text-lg font-bold text-indigo-900">
              {formatCurrency(totalCost)}
            </p>
          </div>
        </div>
      </div>

      {/* Token Breakdown by Type */}
      <div className="rounded bg-gray-50 p-2">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          Audio vs Text Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-1 pr-2 text-left font-medium text-gray-700">
                  Category
                </th>
                <th className="px-2 py-1 text-right font-medium text-blue-700">
                  Text
                </th>
                <th className="px-2 py-1 text-right font-medium text-orange-700">
                  Audio
                </th>
                <th className="px-2 py-1 text-right font-medium text-amber-700">
                  Cached
                </th>
                <th className="px-2 py-1 text-right font-medium text-gray-700">
                  Subtotal
                </th>
                <th className="px-2 py-1 text-right font-medium text-indigo-700">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-1 pr-2 font-medium text-gray-900">Input</td>
                <td className="px-2 py-1 text-right text-blue-600">
                  {formatNumber(merged.input_text_tokens)}
                </td>
                <td className="px-2 py-1 text-right text-orange-600">
                  {formatNumber(merged.input_audio_tokens)}
                </td>
                <td className="px-2 py-1 text-right text-amber-600">
                  {formatNumber(merged.input_cached_tokens)}
                </td>
                <td className="px-2 py-1 text-right font-medium text-gray-900">
                  {formatNumber(merged.input_tokens)}
                </td>
                <td className="px-2 py-1 text-right font-semibold text-indigo-600">
                  {formatCurrency(
                    formatCost(merged.input_text_tokens, REALTIME_PRICING.text_input) +
                    formatCost(merged.input_audio_tokens, REALTIME_PRICING.audio_input) +
                    formatCost(merged.input_cached_tokens, REALTIME_PRICING.cached_text_input)
                  )}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1 pr-2 font-medium text-gray-900">Output</td>
                <td className="px-2 py-1 text-right text-blue-600">
                  {formatNumber(merged.output_text_tokens)}
                </td>
                <td className="px-2 py-1 text-right text-orange-600">
                  {formatNumber(merged.output_audio_tokens)}
                </td>
                <td className="px-2 py-1 text-right text-amber-600">—</td>
                <td className="px-2 py-1 text-right font-medium text-gray-900">
                  {formatNumber(merged.output_tokens)}
                </td>
                <td className="px-2 py-1 text-right font-semibold text-indigo-600">
                  {formatCurrency(
                    formatCost(merged.output_text_tokens, REALTIME_PRICING.text_output) +
                    formatCost(merged.output_audio_tokens, REALTIME_PRICING.audio_output)
                  )}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-bold">
                <td className="py-1 pr-2 text-gray-900">Total</td>
                <td className="px-2 py-1 text-right text-blue-700">
                  {formatNumber(merged.input_text_tokens + merged.output_text_tokens)}
                </td>
                <td className="px-2 py-1 text-right text-orange-700">
                  {formatNumber(merged.input_audio_tokens + merged.output_audio_tokens)}
                </td>
                <td className="px-2 py-1 text-right text-amber-700">
                  {formatNumber(merged.input_cached_tokens)}
                </td>
                <td className="px-2 py-1 text-right text-gray-900">
                  {formatNumber(merged.total_tokens)}
                </td>
                <td className="px-2 py-1 text-right text-indigo-900">
                  {formatCurrency(totalCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Pricing Reference */}
      <div className="rounded bg-gray-50 p-2">
        <p className="text-[10px] text-gray-400">
          Pricing: Text in ${REALTIME_PRICING.text_input}/1M, Audio in ${REALTIME_PRICING.audio_input}/1M,
          Text out ${REALTIME_PRICING.text_output}/1M, Audio out ${REALTIME_PRICING.audio_output}/1M,
          Cached ${REALTIME_PRICING.cached_text_input}/1M (gpt-4o-realtime)
        </p>
      </div>
    </div>
  );
}
