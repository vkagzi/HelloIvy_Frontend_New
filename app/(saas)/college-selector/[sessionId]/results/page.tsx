'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Heading } from '@/app/_components/Typography';
import { useToast } from '@/app/_components/Toast';
import { Button } from '@/components/ui/button';
import {
  collegeSelectorApi,
  CollegeRecommendation,
  TranscriptData,
} from '@/lib/college-selector-api';

type TabType = 'results' | 'history';

const FIT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  reach: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  match: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  safe: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

export default function CollegeSelectorResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string | undefined;
  const { addToast } = useToast();

  const [recommendations, setRecommendations] = useState<CollegeRecommendation[]>([]);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('results');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) loadResults();
  }, [sessionId]);

  useEffect(() => {
    if (activeTab === 'history' && !transcript && sessionId) {
      loadTranscript();
    }
  }, [activeTab, sessionId]);

  async function loadResults() {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      setError(null);

      let data = await collegeSelectorApi.getRecommendations(sessionId);

      if (!data.recommendations || data.recommendations.length === 0) {
        // Generate recommendations first
        setIsGenerating(true);
        await collegeSelectorApi.generateRecommendations(sessionId);
        setIsGenerating(false);
        data = await collegeSelectorApi.getRecommendations(sessionId);
      }

      setRecommendations(data.recommendations || []);
    } catch (e) {
      console.error('Failed to load results:', e);
      setError('Failed to load college recommendations. Please try again.');
      addToast('Failed to load results', { type: 'error' });
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  }

  async function loadTranscript() {
    if (!sessionId) return;
    try {
      setIsLoadingHistory(true);
      const data = await collegeSelectorApi.getTranscript(sessionId);
      setTranscript(data);
    } catch (e) {
      console.error('Failed to load transcript:', e);
      addToast('Failed to load transcript', { type: 'error' });
    } finally {
      setIsLoadingHistory(false);
    }
  }

  const filteredRecs = filterCategory === 'all'
    ? recommendations
    : recommendations.filter((r) => r.fit_category === filterCategory);

  const countByCategory = {
    all: recommendations.length,
    reach: recommendations.filter((r) => r.fit_category === 'reach').length,
    match: recommendations.filter((r) => r.fit_category === 'match').length,
    safe: recommendations.filter((r) => r.fit_category === 'safe').length,
  };

  if (isLoading || isGenerating) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-500" />
          <p className="text-lg font-medium text-gray-700">
            {isGenerating
              ? 'Generating your personalized college recommendations...'
              : 'Loading results...'}
          </p>
          {isGenerating && (
            <p className="mt-2 text-sm text-gray-500">This may take a moment as we analyze 20 colleges for you.</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <Button onClick={() => loadResults()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-b from-green-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Heading level={1}>🏫 College Recommendations</Heading>
          <p className="mt-1 text-gray-600">
            {recommendations.length} colleges selected based on your preferences and conversation.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
          {(['results', 'history'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'results' ? 'College Recommendations' : 'Conversation History'}
            </button>
          ))}
        </div>

        {activeTab === 'results' && (
          <>
            {/* Filter Chips */}
            <div className="mb-6 flex flex-wrap gap-2">
              {(['all', 'reach', 'match', 'safe'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    filterCategory === cat
                      ? cat === 'all'
                        ? 'bg-gray-900 text-white'
                        : `${FIT_COLORS[cat].bg} ${FIT_COLORS[cat].text} ring-2 ring-current`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)} ({countByCategory[cat]})
                </button>
              ))}
            </div>

            {/* College Cards */}
            <div className="space-y-4">
              {filteredRecs.map((rec, idx) => {
                const colors = FIT_COLORS[rec.fit_category] || FIT_COLORS.match;
                const isExpanded = expandedCard === rec.university_name;

                return (
                  <div
                    key={rec.university_name + idx}
                    className={`rounded-xl border-2 ${colors.border} bg-white shadow-sm transition-all hover:shadow-md`}
                  >
                    {/* Card Header */}
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : rec.university_name)}
                      className="w-full p-5 text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{rec.university_name}</h3>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.bg} ${colors.text}`}>
                              {rec.fit_category.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{rec.location}, {rec.country}</p>
                          <p className="text-sm text-gray-500 mt-1">{rec.degree_and_major} · {rec.university_type}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{rec.match_percentage}%</div>
                          <div className="text-xs text-gray-500">Match</div>
                        </div>
                      </div>
                      {!isExpanded && rec.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{rec.description}</p>
                      )}
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-5 pb-5">
                        {rec.description && (
                          <p className="mt-4 text-sm text-gray-700">{rec.description}</p>
                        )}

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <DetailItem label="Tuition Fees" value={rec.tuition_fees} />
                          <DetailItem label="Cost of Living" value={rec.cost_of_living} />
                          <DetailItem label="Acceptance Rate" value={rec.acceptance_rate} />
                          <DetailItem label="Application Fee" value={rec.application_fee} />
                          <DetailItem label="Employment Rate" value={rec.employment_rate} />
                          <DetailItem label="Language" value={rec.language} />
                          <DetailItem label="Campus Type" value={rec.campus_type} />
                          <DetailItem label="Post-Study Work Visa" value={rec.post_study_work_visa} />
                          <DetailItem label="Int'l Student Support" value={rec.intl_student_support} />
                        </div>

                        {rec.global_ranking && Object.keys(rec.global_ranking).length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Global Rankings</h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(rec.global_ranking).map(([system, rank]) => (
                                <span key={system} className="rounded bg-gray-100 px-3 py-1 text-xs text-gray-700">
                                  {system}: {rank}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {rec.scholarships && rec.scholarships.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Scholarships</h4>
                            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                              {rec.scholarships.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        )}

                        {rec.tests_required && rec.tests_required.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Tests Required</h4>
                            <div className="flex flex-wrap gap-2">
                              {rec.tests_required.map((t, i) => (
                                <span key={i} className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {rec.deadlines && Object.keys(rec.deadlines).length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Application Deadlines</h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(rec.deadlines).map(([round, date]) => (
                                <span key={round} className="rounded bg-purple-50 px-3 py-1 text-xs text-purple-700">
                                  {round}: {date}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {rec.additional_requirements && rec.additional_requirements.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Requirements</h4>
                            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                              {rec.additional_requirements.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>
                        )}

                        {rec.website_url && (
                          <div className="mt-4">
                            <a
                              href={rec.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700"
                            >
                              Visit Website →
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredRecs.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-500">No colleges found for this filter.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-500" />
              </div>
            ) : transcript?.messages && transcript.messages.length > 0 ? (
              transcript.messages.map((msg, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 bg-white p-4">
                  {msg.bot_question && (
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-green-600">Ivy</span>
                      <p className="text-sm text-gray-800">{msg.bot_question}</p>
                    </div>
                  )}
                  {msg.student_response && (
                    <div>
                      <span className="text-xs font-semibold text-blue-600">You</span>
                      <p className="text-sm text-gray-800">{msg.student_response}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-500">No conversation history available.</p>
              </div>
            )}
          </div>
        )}

        {/* Back / Start New */}
        <div className="mt-8 flex gap-4 pb-8">
          <Button variant="outline" onClick={() => router.push('/college-selector')}>
            ← Back to College Selector
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}
