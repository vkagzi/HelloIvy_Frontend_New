'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { useToast } from '@/app/_components/Toast';
import {
  careerDiscoveryApi,
  CareerRecommendation,
} from '@/lib/career-discovery-api';

type Role = 'bot' | 'user';

interface Message {
  message_id: string;
  type: Role;
  content: string;
  timestamp: string;
}

type TabType = 'results' | 'history';

/** ================== Component ================== */
const CareerResultsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string | undefined;
  const { addToast } = useToast();

  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('results');

  // Load recommendations on mount
  useEffect(() => {
    if (sessionId) {
      loadRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Load conversation history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && conversationHistory.length === 0 && sessionId) {
      loadConversationHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sessionId]);

  async function loadRecommendations() {
    try {
      setIsLoading(true);
      setError(null);

      if (!sessionId) {
        setError('No session found. Please complete the career discovery first.');
        addToast('No session data found.', { type: 'warning' });
        setIsLoading(false);
        return;
      }

      // First try to get existing recommendations
      try {
        const existingRecs = await careerDiscoveryApi.getRecommendations(sessionId);
        if (existingRecs.recommendations && existingRecs.recommendations.length > 0) {
          setRecommendations(existingRecs.recommendations);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.log('No existing recommendations, generating new ones...');
      }

      // Generate new recommendations via backend
      const result = await careerDiscoveryApi.generateRecommendations(sessionId);

      if (result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations);
      } else {
        setError('No career recommendations were generated. Please try again.');
      }
    } catch (e) {
      console.error('Failed to load recommendations:', e);
      setError('Failed to load career recommendations. Please try again.');
      addToast('Failed to load career recommendations', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadConversationHistory() {
    if (!sessionId) return;
    
    try {
      setIsLoadingHistory(true);
      const historyResponse = await careerDiscoveryApi.getMessages(sessionId);
      setConversationHistory(historyResponse.messages);
    } catch (e) {
      console.error('Failed to load conversation history:', e);
      addToast('Failed to load conversation history', { type: 'error' });
    } finally {
      setIsLoadingHistory(false);
    }
  }

  const handleTryAgain = async () => {
    if (!sessionId) {
      router.push('/career-discovery');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await careerDiscoveryApi.generateRecommendations(sessionId);
      if (result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations);
      } else {
        setError('No career recommendations were generated. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load career recommendations. Please try again.');
      addToast('Failed to load career recommendations', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-linear-to-br from-purple-50 to-blue-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Analyzing Your Career Profile
          </h2>
          <p className="text-gray-600">
            Generating personalized career recommendations based on your
            conversation…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-linear-to-br from-purple-50 to-blue-100">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 p-3">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Unable to Load Results
          </h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => router.push(`/career-discovery/${sessionId}/conversations`)}
              className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              Continue Conversation
            </button>
            <button
              onClick={handleTryAgain}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-linear-to-br from-purple-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Heading level={1} className="mb-4 text-4xl font-bold text-gray-900">
            🎯 Your Career Recommendations
          </Heading>
          <Paragraph className="mx-auto max-w-3xl text-xl text-gray-600">
            Based on your latest conversation, here are careers aligned to your
            interests and strengths.
          </Paragraph>
        </div>

        {/* Tabs */}
        <div className="mx-auto mb-8 max-w-5xl">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'results'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Career Results
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Conversation History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'results' ? (
          <>
            {/* Summary Stats */}
            <div className="mx-auto mb-8 max-w-4xl rounded-lg bg-white p-6 shadow-lg">
              <div className="grid gap-6 text-center md:grid-cols-3">
                <div>
                  <div className="text-3xl font-bold text-purple-600">
                    {recommendations.length}
                  </div>
                  <div className="text-sm text-gray-600">Career Matches</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {recommendations.length > 0
                      ? Math.round(
                          recommendations.reduce(
                            (sum, rec) => sum + rec.match_percentage,
                            0
                          ) / recommendations.length
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Average Match</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {
                      recommendations.filter((rec) => rec.match_percentage >= 80)
                        .length
                    }
                  </div>
                  <div className="text-sm text-gray-600">High Matches</div>
                </div>
              </div>
            </div>

            {/* Recommendation Cards */}
            <div className="mx-auto max-w-5xl space-y-6">
              {recommendations.map((career, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-lg bg-white shadow-lg"
                >
                  {/* Header */}
                  <div className="bg-linear-to-r from-purple-600 to-blue-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {career.match_percentage >= 90
                            ? '🌟'
                            : career.match_percentage >= 80
                              ? '🎯'
                              : career.match_percentage >= 70
                                ? '✨'
                                : '💡'}
                        </span>
                        <div>
                          <h3 className="text-2xl font-bold">
                            {career.career_title}
                          </h3>
                          <p className="text-purple-100 opacity-90">
                            {career.salary_range}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          career.match_percentage >= 90
                            ? 'bg-green-100 text-green-600'
                            : career.match_percentage >= 80
                              ? 'bg-blue-100 text-blue-600'
                              : career.match_percentage >= 70
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {career.match_percentage}% Match
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h4 className="mb-3 text-lg font-semibold text-gray-900">
                          Career Overview
                        </h4>
                        <p className="mb-4 leading-relaxed text-gray-600">
                          {career.description}
                        </p>

                        <h4 className="mb-3 text-lg font-semibold text-gray-900">
                          Why This Career Fits You
                        </h4>
                        <p className="mb-4 leading-relaxed text-gray-600">
                          {career.why_recommended}
                        </p>

                        <h4 className="mb-3 text-lg font-semibold text-gray-900">
                          How This Matches Your Interests
                        </h4>
                        <ul className="mb-4 space-y-2">
                          {career.alignment_points?.map((point, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <svg
                                className="mt-0.5 h-5 w-5 shrink-0 text-purple-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-gray-600">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="mb-3 text-lg font-semibold text-gray-900">
                          Required Skills
                        </h4>
                        <div className="mb-6 flex flex-wrap gap-2">
                          {career.required_skills.map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        <h4 className="mb-3 text-lg font-semibold text-gray-900">
                          Next Steps
                        </h4>
                        <ul className="space-y-2">
                          {career.next_steps.map((step, stepIndex) => (
                            <li
                              key={stepIndex}
                              className="flex items-start space-x-2"
                            >
                              <svg
                                className="mt-0.5 h-5 w-5 shrink-0 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-gray-600">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Conversation History Tab */
          <div className="mx-auto max-w-4xl">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
                <span className="ml-3 text-gray-600">
                  Loading conversation history...
                </span>
              </div>
            ) : conversationHistory.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center shadow-lg">
                <p className="text-gray-600">No conversation history found.</p>
              </div>
            ) : (
              <div className="space-y-4 rounded-lg bg-white p-6 shadow-lg">
                <Heading level={3} className="mb-6 text-lg font-semibold text-gray-900">
                  Full Conversation Transcript
                </Heading>
                <div className="space-y-4">
                  {conversationHistory.map((message) => (
                    <div
                      key={message.message_id}
                      className={`flex ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-3xl ${
                          message.type === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div className="mb-1 text-xs text-gray-500">
                          {message.type === 'user' ? 'You' : 'Career Coach'} •{' '}
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div
                          className={`rounded-lg px-4 py-3 ${
                            message.type === 'user'
                              ? 'bg-linear-to-r from-purple-500 to-blue-500 text-white'
                              : 'border border-gray-200 bg-gray-50 text-gray-900'
                          }`}
                        >
                          <Paragraph
                            className={
                              message.type === 'user'
                                ? 'text-white'
                                : 'text-gray-900'
                            }
                          >
                            {message.content}
                          </Paragraph>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 space-x-4 text-center">
          <button
            onClick={() => router.push('/career-discovery')}
            className="rounded-lg bg-linear-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white hover:from-purple-700 hover:to-blue-700"
          >
            Discover More Careers
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            📄 Save Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareerResultsPage;
