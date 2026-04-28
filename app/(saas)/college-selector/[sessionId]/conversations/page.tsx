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

// ─── API Adapter ────────────────────────────────────────────────
const collegeSelectorApiAdapter: ConversationConfig['api'] = {
  getSession: async (sessionId) => {
    const s: CollegeSelectorSession = await collegeSelectorApi.getSession(sessionId);
    return {
      created_at: s.created_at,
      is_completed: s.is_completed,
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
    } as HistoryResponse;
  },
  sendMessage: async (sessionId, content) => {
    const r: SendMessageResponse = await collegeSelectorApi.sendMessage(sessionId, content);
    return r as unknown as SendResponse;
  },
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
      };

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
      };
    },

    parseSendResponse: (response: SendResponse) => {
      const r = response as SendResponse & {
        progress_percentage: number;
        questions_completed: number;
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

    renderExitDialog: ({ onStay, onExit }) => ({
      title: 'Leave College Selection?',
      description:
        'Your conversation progress will be saved. You can resume later from where you left off.',
      stayLabel: 'Stay',
      exitLabel: 'Leave & Save',
      onStay,
      onExit,
    }),
  },
};

export default function CollegeSelectorConversationPage() {
  return <ConversationTemplate config={collegeSelectorConversationConfig} />;
}
