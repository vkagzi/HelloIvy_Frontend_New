'use client';

import React, { useState, useEffect } from 'react';
import { domainDiscoveryApi, DebugInfo } from '@/lib/domain-discovery-api';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TokenUsagePanel } from '@/components/TokenUsagePanel';

interface DomainDebugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  isTimerExpired: boolean;
  debugOverrideTimerBlock: boolean;
  onDebugOverrideTimerBlockChange: (value: boolean) => void;
}

export function DomainDebugDialog({
  open,
  onOpenChange,
  sessionId,
  isTimerExpired,
  debugOverrideTimerBlock,
  onDebugOverrideTimerBlockChange,
}: DomainDebugDialogProps): React.ReactElement {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDebugInfo = React.useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await domainDiscoveryApi.getDebugInfo(sessionId);
      setDebugInfo(data);
    } catch (err) {
      console.error('Failed to load debug info:', err);
      setError('Failed to load debug information');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (open && sessionId) {
      void loadDebugInfo();
    }
  }, [open, sessionId, loadDebugInfo]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogTitle>🐛 Debug Information</DialogTitle>
        <DialogDescription>
          Technical details about the domain discovery session
        </DialogDescription>

        {/* Timer override toggle */}
        <div className="rounded-lg border border-orange-300 bg-orange-50 p-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={debugOverrideTimerBlock}
              onChange={(e) => onDebugOverrideTimerBlockChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-orange-600"
            />
            <span className="font-medium text-orange-800">
              Override timer block (allow messaging after 30 min)
            </span>
            {isTimerExpired && (
              <span className="ml-1 rounded bg-red-200 px-1.5 py-0.5 text-xs font-semibold text-red-800">
                Timer expired
              </span>
            )}
          </label>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {!isLoading && !error && debugInfo && (
          <Tabs defaultValue="model" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="model" className="flex-1">
                Model Info
              </TabsTrigger>
              <TabsTrigger value="token-usage" className="flex-1">
                Token Usage
              </TabsTrigger>
              <TabsTrigger value="deepdive-prompt" className="flex-1">
                Deep Dive Prompt
              </TabsTrigger>
              <TabsTrigger value="recommendations-prompt" className="flex-1">
                Recommendations Prompt
              </TabsTrigger>
              <TabsTrigger value="user-profile" className="flex-1">
                User Profile Context
              </TabsTrigger>
            </TabsList>

            <TabsContent value="model" className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  LLM Provider
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Provider
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {debugInfo.model_info?.provider ?? 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Current Phase
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {debugInfo.current_phase}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  Main LLM (Conversation)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Type</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {debugInfo.model_info?.main_llm?.type ?? 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Model</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {debugInfo.model_info?.main_llm?.model ?? 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Temperature
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {debugInfo.model_info?.main_llm?.temperature ?? 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Max Tokens
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {debugInfo.model_info?.main_llm?.max_tokens ?? 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  Recommendations LLM
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Type</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {debugInfo.model_info?.recommendations_llm?.type ?? 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Model</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {debugInfo.model_info?.recommendations_llm?.model ??
                        'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Temperature
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {debugInfo.model_info?.recommendations_llm?.temperature ??
                        'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Max Tokens
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {debugInfo.model_info?.recommendations_llm?.max_tokens ??
                        'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="token-usage">
              <TokenUsagePanel tokenUsage={debugInfo.token_usage} />
            </TabsContent>

            <TabsContent value="deepdive-prompt">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  Deep Dive Question Generation Prompt
                </h3>
                <pre className="max-h-[500px] overflow-y-auto rounded bg-gray-900 p-4 text-xs whitespace-pre-wrap text-green-400">
                  {debugInfo.system_prompts.deepdive_question_prompt.replace(
                    '{user_profile_context}',
                    debugInfo.user_profile_context + debugInfo.riasec_context
                  )}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="recommendations-prompt">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  Recommendations Generation Prompt
                </h3>
                <pre className="max-h-[500px] overflow-y-auto rounded bg-gray-900 p-4 text-xs whitespace-pre-wrap text-green-400">
                  {debugInfo.system_prompts.recommendations_prompt}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="user-profile">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  User Profile Context (As Passed to AI)
                </h3>
                <pre className="max-h-[500px] overflow-y-auto rounded bg-gray-900 p-4 text-xs whitespace-pre-wrap text-green-400">
                  {debugInfo.user_profile_context}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
