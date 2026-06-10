'use client';

import React from 'react';
import {
  ConversationTemplate,
} from '@/app/(saas)/_components/ConversationTemplate';
import type {
  ConversationConfig,
  ConversationMessage,
  HistoryResponse,
  SendResponse,
  SessionInfo,
} from '@/app/(saas)/_components/ConversationTemplate';
import {
  collegeSelectorApi,
  type CollegeSelectorSession,
  type MessageHistoryResponse,
  type SendMessageResponse,
} from '@/lib/college-selector-api';
import { streamApi } from '@/lib/api-client';
import { CollegeDebugDialog } from '@/components/CollegeDebugDialog';

// ─── API Adapter ────────────────────────────────────────────────
const collegeSelectorApiAdapter: ConversationConfig['api'] = {
  getSession: async (sessionId) => {
    const s: CollegeSelectorSession = await collegeSelectorApi.getSession(sessionId);
    const conversationStartedAt = typeof s.metadata?.conversation_started_at === 'string'
      ? s.metadata.conversation_started_at
      : undefined;

    return {
      created_at: conversationStartedAt,
      is_completed: s.is_completed,
      is_trial_locked: (s as any).is_trial_locked,
      metadata: s.metadata,
    };
  },
  getMessages: async (sessionId) => {
    const r: MessageHistoryResponse = await collegeSelectorApi.getMessages(sessionId);
    return {
      messages: r.messages.map((m) => ({
        message_id: m.message_id,
        type: m.type,
        content: m.content,
        timestamp: m.timestamp,
        medium: m.medium,
      })),
      current_step: r.current_step,
      total_steps: r.total_steps,
      is_completed: r.is_completed,
      is_trial_locked: (r as any).is_trial_locked,
    } as HistoryResponse;
  },
  sendMessage: async (sessionId, content) => {
    const r: SendMessageResponse = await collegeSelectorApi.sendMessage(sessionId, content);
    return r as unknown as SendResponse;
  },
  streamMessage: (sessionId, content) =>
    streamApi(`/api/college-selector/${sessionId}/messages/stream/`, {
      method: 'POST',
      body: { content },
    }),
  togglePause: (sessionId) => collegeSelectorApi.togglePause(sessionId),
};

// ─── Config ─────────────────────────────────────────────────────
const collegeSelectorConversationConfig: ConversationConfig = {
  featureId: 'college-selector',
  featureLabel: 'CollegeSelector',
  pageTitle: '🏫 College Selection Conversation',
  baseRoute: '/college-selector',
  transcriptKeyPrefix: 'college_selector_transcript',
  theme: {
    bgFrom: 'from-green-50',
    bgTo: 'to-emerald-100',
    bubbleFrom: 'from-green-500',
    bubbleTo: 'to-emerald-500',
    ctaFrom: 'from-green-600',
    ctaTo: 'to-emerald-600',
    ctaHoverFrom: 'from-green-700',
    ctaHoverTo: 'to-emerald-700',
    timerAccent: 'green',
    accentName: 'green',
    userTimestampColor: 'text-green-100',
  },
  api: collegeSelectorApiAdapter,
  callbacks: {
    parseHistory: (historyResponse: HistoryResponse, sessionInfo: SessionInfo | null) => {
      const r = historyResponse as HistoryResponse & {
        current_step?: number;
        total_steps?: number;
        is_completed?: boolean;
        is_trial_locked?: boolean;
      };

      if (!sessionInfo?.created_at && historyResponse.messages.length > 0) {
        sessionInfo = {
          ...(sessionInfo ?? {}),
          created_at: historyResponse.messages[0].timestamp,
        };
      }

      const currentStep = r.current_step ?? 0;
      const totalSteps = r.total_steps ?? 20;

      let progressPercentage = totalSteps > 0
        ? Math.round((currentStep / totalSteps) * 100)
        : 0;
      let ended = false;
      if ((sessionInfo as any)?.is_completed || r.is_completed) {
        ended = true;
        progressPercentage = 100;
      }

      const messages: ConversationMessage[] = historyResponse.messages.map((m) => ({
        id: m.message_id,
        type: m.type,
        content: m.content,
        timestamp: m.timestamp,
        medium: (m.medium as 'text' | 'voice') || 'text',
      }));

      return {
        messages,
        questionsCompleted: currentStep,
        progressPercentage,
        sessionEnded: ended,
        isTrialLocked: (sessionInfo as any)?.is_trial_locked || r.is_trial_locked
      };
    },

    parseSendResponse: (response: SendResponse) => {
      const r = response as SendResponse & {
        progress_percentage: number;
        questions_completed: number;
        is_trial_locked?: boolean;
      };

      return {
        botMessage: {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: r.bot_response,
          timestamp: new Date().toISOString(),
          medium: 'text' as const,
        },
        questionsCompleted: r.questions_completed,
        progressPercentage: r.progress_percentage,
        sessionEnded: r.is_complete,
        isTrialLocked: r.is_trial_locked,
      };
    },

    canEndConversation: ({ sessionEnded }) => sessionEnded,

    handleEnd: async ({ sessionId, sessionEnded }) => {
      if (sessionEnded) {
        return `/college-selector/${sessionId}/results`;
      }
      return null;
    },
  },
  slots: {
    loadingText: 'Ivy is thinking…',

    renderCompletionBanner: ({ onViewResults }) => (
      <div className="flex justify-center">
        <div className="max-w-3xl">
          <div className="rounded-lg border-2 border-green-300 bg-green-50 px-6 py-4 text-center shadow-sm">
            <p className="mb-4 text-sm font-semibold text-green-900">
              Conversation complete!
            </p>
            <p className="mb-4 text-sm text-green-800">
              Click below to generate your personalized college recommendations.
            </p>
            <button
              onClick={onViewResults}
              className="rounded-lg bg-linear-to-r from-green-600 to-emerald-600 px-6 py-2 text-white hover:from-green-700 hover:to-emerald-700"
            >
              View College Recommendations →
            </button>
          </div>
        </div>
      </div>
    ),

    renderExitDialog: ({ onConfirm, onCancel }) => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Leave College Selection?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Your conversation progress will be saved. You can resume later from where you left off.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Stay
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Leave & Save
            </button>
          </div>
        </div>
      </div>
    ),

    renderDebugDialog: (props) => <CollegeDebugDialog {...props} />,
  },
};

export default function CollegeSelectorConversationPage() {
  return <ConversationTemplate config={collegeSelectorConversationConfig} />;
}
