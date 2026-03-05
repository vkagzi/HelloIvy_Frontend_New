'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
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
  domainDiscoveryApi,
  type DomainDiscoverySession,
  type MessageHistoryResponse,
  type SendMessageResponse,
} from '@/lib/domain-discovery-api';
import { DomainDebugDialog } from '@/components/DomainDebugDialog';

// ─── API Adapter ────────────────────────────────────────────────
const domainApi: ConversationConfig['api'] = {
  getSession: async (sessionId) => {
    const s: DomainDiscoverySession = await domainDiscoveryApi.getSession(sessionId);
    return {
      created_at: s.created_at,
      is_completed: s.is_completed,
      metadata: s.metadata,
    };
  },
  getMessages: async (sessionId) => {
    const r: MessageHistoryResponse = await domainDiscoveryApi.getMessages(sessionId);
    return {
      messages: r.messages.map((m) => ({
        message_id: m.message_id,
        type: m.type,
        content: m.content,
        timestamp: m.timestamp,
        question_type: m.question_type,
        choices: m.choices,
      })),
      riasec_completed: r.riasec_completed,
      deepdive_completed: r.deepdive_completed,
      is_completed: r.is_completed,
    } as HistoryResponse;
  },
  sendMessage: async (sessionId, content) => {
    const r: SendMessageResponse = await domainDiscoveryApi.sendMessage(sessionId, content);
    return r as unknown as SendResponse;
  },
  togglePause: (sessionId) => domainDiscoveryApi.togglePause(sessionId),
};

// ─── Config ─────────────────────────────────────────────────────
const domainConversationConfig: ConversationConfig = {
  featureId: 'domain-discovery',
  featureLabel: 'DomainDiscovery',
  pageTitle: '🧭 Domain Discovery Journey',
  baseRoute: '/domain-discovery',
  transcriptKeyPrefix: 'domain_conversation_transcript',
  theme: {
    bgFrom: 'from-teal-50',
    bgTo: 'to-cyan-100',
    bubbleFrom: 'from-teal-500',
    bubbleTo: 'to-cyan-500',
    ctaFrom: 'from-teal-600',
    ctaTo: 'to-cyan-600',
    ctaHoverFrom: 'from-teal-700',
    ctaHoverTo: 'to-cyan-700',
    timerAccent: 'teal',
    accentName: 'teal',
    userTimestampColor: 'text-teal-100',
  },
  api: domainApi,
  callbacks: {
    parseHistory: (historyResponse: HistoryResponse, sessionInfo: SessionInfo | null) => {
      const r = historyResponse as HistoryResponse & {
        riasec_completed?: number;
        deepdive_completed?: number;
        is_completed?: boolean;
      };
      const si = sessionInfo as SessionInfo & {
        riasec_completed?: number;
        deepdive_completed?: number;
        current_step?: number;
      } | null;

      const rq = si?.riasec_completed ?? r.riasec_completed ?? 0;
      const dq = si?.deepdive_completed ?? r.deepdive_completed ?? 0;
      const questionsCompleted = rq + dq;

      let progressPercentage = si?.current_step
        ? Math.min(si.current_step * 10, 90)
        : 0;
      let ended = false;
      if (si?.is_completed || r.is_completed) {
        ended = true;
        progressPercentage = 100;
      }

      const messages: ConversationMessage[] = historyResponse.messages.map((m) => ({
        id: m.message_id,
        type: m.type,
        content: m.content,
        timestamp: m.timestamp,
        extra: {
          question_type: m.question_type,
          choices: m.choices,
        },
      }));

      return { messages, questionsCompleted, progressPercentage, sessionEnded: ended };
    },

    parseSendResponse: (response: SendResponse) => {
      const r = response as SendResponse & {
        question_type?: string;
        choices?: string[];
        progress_percentage: number;
        questions_completed: number;
      };

      return {
        botMessage: {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: r.bot_response,
          timestamp: new Date().toISOString(),
          extra: {
            question_type: r.question_type,
            choices: r.choices,
          },
        },
        questionsCompleted: r.questions_completed,
        progressPercentage: r.progress_percentage,
        sessionEnded: r.is_complete,
      };
    },

    canEndConversation: ({ sessionEnded }) => sessionEnded,

    handleEnd: async ({ sessionId, sessionEnded }) => {
      if (sessionEnded) {
        return `/domain-discovery/${sessionId}/results`;
      }
      // The exit dialog will be shown by the template via renderExitDialog slot
      return null;
    },
  },
  slots: {
    loadingText: 'Domain AI is thinking…',

    renderBotMessageExtra: ({ message, isLatest, isLoading, onOptionSelect }) => {
      const qType = message.extra?.question_type;
      const choices = message.extra?.choices as string[] | undefined;
      const isInitialQuestion = qType === 'riasec' && choices && choices.length > 0;

      if (!isLatest || !isInitialQuestion || isLoading) return null;

      return (
        <div className="mt-3 flex gap-3">
          {choices.map((choice, idx) => (
            <Button
              key={idx}
              onClick={() => onOptionSelect?.(choice)}
              className="rounded-lg border-2 border-teal-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-all hover:border-teal-500 hover:bg-teal-50 hover:shadow-md"
            >
              {choice}
            </Button>
          ))}
        </div>
      );
    },

    renderCompletionBanner: ({ onViewResults }) => (
      <div className="flex justify-center">
        <div className="max-w-3xl">
          <div className="rounded-lg border-2 border-green-300 bg-green-50 px-6 py-4 text-center shadow-sm">
            <p className="mb-4 text-sm font-semibold text-green-900">
              🎉 Conversation complete!
            </p>
            <p className="mb-4 text-sm text-green-800">
              Click below to generate your personalized domain recommendations.
            </p>
            <button
              onClick={onViewResults}
              className="rounded-lg bg-linear-to-r from-purple-600 to-blue-600 px-6 py-2 text-white hover:from-purple-700 hover:to-blue-700"
            >
              View Results →
            </button>
          </div>
        </div>
      </div>
    ),

    inputBlockReason: ({ isLoading, messages }) => {
      if (isLoading) return null; // default loading indicator will show
      const latestBot = messages.filter((m) => m.type === 'bot').slice(-1)[0];
      const isInitial =
        latestBot?.extra?.question_type === 'riasec' &&
        Array.isArray(latestBot?.extra?.choices) &&
        (latestBot.extra.choices as string[]).length > 0;
      if (isInitial) return '👆 Please select one of the options above to continue';
      return null;
    },

    renderDebugDialog: (props) => <DomainDebugDialog {...props} />,

    renderExitDialog: ({ onConfirm, onCancel }) => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Domain Discovery Not Complete
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Your conversation is still in progress. The AI coach will wrap up when it
              has enough information about your interests.
            </p>
            <p className="mt-2 text-sm font-medium text-gray-700">
              Are you sure you want to exit without getting your results?
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Continue Session
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Exit Anyway
            </button>
          </div>
        </div>
      </div>
    ),
  },
};

const DomainConversationPage: React.FC = () => (
  <ConversationTemplate config={domainConversationConfig} />
);

export default DomainConversationPage;
