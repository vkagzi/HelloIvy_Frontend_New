'use client';

import React, { useMemo, useState } from 'react';
import { useToast } from '@/app/_components/Toast';
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
  careerDiscoveryApi,
  type CareerDiscoverySession,
  type MessageHistoryResponse,
  type SendMessageResponse,
} from '@/lib/career-discovery-api';
import { CareerDebugDialog } from '@/components/CareerDebugDialog';

// ─── API Adapter ────────────────────────────────────────────────
const careerApi: ConversationConfig['api'] = {
  getSession: async (sessionId) => {
    const s: CareerDiscoverySession = await careerDiscoveryApi.getSession(sessionId);
    return {
      created_at: s.created_at,
      is_completed: s.is_completed,
      metadata: s.metadata,
    };
  },
  getMessages: async (sessionId) => {
    const r: MessageHistoryResponse = await careerDiscoveryApi.getMessages(sessionId);
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
      total_questions: r.total_questions,
      is_completed: r.is_completed,
    } as HistoryResponse;
  },
  sendMessage: async (sessionId, content) => {
    const r: SendMessageResponse = await careerDiscoveryApi.sendMessage(sessionId, content);
    return r as unknown as SendResponse;
  },
  togglePause: (sessionId) => careerDiscoveryApi.togglePause(sessionId),
};

// ─── Wrapper to inject recommendation generation logic ──────────
const CareerConversationPage: React.FC = () => {
  const { addToast } = useToast();
  const [isGeneratingResults, setIsGeneratingResults] = useState(false);
  const [resultsGenerationFailed, setResultsGenerationFailed] = useState(false);
  const [generatingMessages, setGeneratingMessages] = useState<ConversationMessage[]>([]);

  const config: ConversationConfig = useMemo(
    () => ({
      featureId: 'career-discovery',
      featureLabel: 'CareerDiscovery',
      pageTitle: '🚀 Career & Degree SelectionJourney',
      baseRoute: '/career-discovery',
      transcriptKeyPrefix: 'career_conversation_transcript',
      theme: {
        bgFrom: 'from-purple-50',
        bgTo: 'to-blue-100',
        bubbleFrom: 'from-purple-500',
        bubbleTo: 'to-blue-500',
        ctaFrom: 'from-purple-600',
        ctaTo: 'to-blue-600',
        ctaHoverFrom: 'from-purple-700',
        ctaHoverTo: 'to-blue-700',
        timerAccent: 'purple',
        accentName: 'purple',
        userTimestampColor: 'text-purple-100',
      },
      api: careerApi,
      callbacks: {
        parseHistory: (historyResponse: HistoryResponse, sessionInfo: SessionInfo | null) => {
          const r = historyResponse as HistoryResponse & {
            current_step?: number;
            total_steps?: number;
            total_questions?: number;
            is_completed?: boolean;
          };
          const total = r.total_questions || r.total_steps || 20;
          const completed = r.current_step ?? 0;
          const progressPercentage = Math.round((completed / total) * 100);
          const ended = sessionInfo?.is_completed || r.is_completed || false;

          const messages: ConversationMessage[] = historyResponse.messages.map((m) => ({
            id: m.message_id,
            type: m.type,
            content: m.content,
            timestamp: m.timestamp,
            medium: (m.medium as 'text' | 'voice') || 'text',
          }));

          return {
            messages,
            questionsCompleted: completed,
            progressPercentage: ended ? 100 : progressPercentage,
            sessionEnded: ended,
          };
        },

        parseSendResponse: (response: SendResponse) => {
          const r = response as SendResponse & {
            current_step: number;
            total_steps: number;
          };
          const total = r.total_steps || 20;

          return {
            botMessage: {
              id: `bot-${Date.now()}`,
              type: 'bot',
              content: r.bot_response,
              timestamp: new Date().toISOString(),
              medium: 'text' as const,
            },
            questionsCompleted: r.current_step,
            progressPercentage: Math.round((r.current_step / total) * 100),
            sessionEnded: r.is_complete,
          };
        },

        canEndConversation: ({ sessionEnded, messages }) => {
          if (sessionEnded) return true;
          // Career uses answer count to determine if all questions are done
          const userAnswerCount = messages.filter((m) => m.type === 'user').length;
          return userAnswerCount >= 20;
        },

        handleEnd: async ({ sessionId }) => {
          // Career has a generation step before navigating
          setIsGeneratingResults(true);
          setResultsGenerationFailed(false);

          const generatingMsg: ConversationMessage = {
            id: `system-${Date.now()}`,
            type: 'bot',
            content: '🔄 Generating your personalized career recommendations... This may take a moment.',
            timestamp: new Date().toISOString(),
          };
          setGeneratingMessages([generatingMsg]);
          addToast('Generating your career recommendations…', { type: 'success' });

          try {
            try {
              await careerDiscoveryApi.endSession(sessionId);
            } catch (err) {
              console.error('Could not end session on server', err);
            }

            const result = await careerDiscoveryApi.generateRecommendations(sessionId);
            if (result.recommendations && result.recommendations.length > 0) {
              setGeneratingMessages([]);
              addToast('Your results are ready!', { type: 'success' });
              return `/career-discovery/${sessionId}/results`;
            } else {
              throw new Error('No recommendations generated');
            }
          } catch (genError) {
            console.error('Failed to generate recommendations:', genError);
            setGeneratingMessages([]);
            setResultsGenerationFailed(true);
            addToast('Failed to generate recommendations. Please try again.', {
              type: 'error',
            });
            return null;
          } finally {
            setIsGeneratingResults(false);
          }
        },
      },
      slots: {
        loadingText: 'Ivy is thinking…',

        renderCompletionBanner: ({ onViewResults }) => {
          if (isGeneratingResults) {
            return (
              <div className="flex justify-center">
                <div className="max-w-3xl">
                  <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
                    <span className="text-sm text-gray-500">
                      🔄 Generating your personalized career recommendations...
                    </span>
                  </div>
                </div>
              </div>
            );
          }
          if (resultsGenerationFailed) {
            return (
              <div className="flex justify-center">
                <div className="max-w-3xl">
                  <div className="rounded-lg border-2 border-red-300 bg-red-50 px-6 py-4 text-center shadow-sm">
                    <p className="mb-4 text-sm font-semibold text-red-900">
                      ❌ Failed to generate recommendations
                    </p>
                    <p className="mb-4 text-sm text-red-800">
                      There was an issue generating your recommendations. Please try again.
                    </p>
                    <button
                      onClick={onViewResults}
                      className="rounded-lg bg-linear-to-r from-purple-600 to-blue-600 px-6 py-2 text-white hover:from-purple-700 hover:to-blue-700"
                    >
                      Retry →
                    </button>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div className="flex justify-center">
              <div className="max-w-3xl">
                <div className="rounded-lg border-2 border-green-300 bg-green-50 px-6 py-4 text-center shadow-sm">
                  <p className="mb-4 text-sm font-semibold text-green-900">
                    🎉 All questions completed!
                  </p>
                  <p className="mb-4 text-sm text-green-800">
                    You&apos;ve completed all questions. Click below to generate your
                    personalized career recommendations.
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
          );
        },

        renderDebugDialog: (props) => <CareerDebugDialog {...props} />,
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isGeneratingResults, resultsGenerationFailed],
  );

  return <ConversationTemplate config={config} />;
};

export default CareerConversationPage;
