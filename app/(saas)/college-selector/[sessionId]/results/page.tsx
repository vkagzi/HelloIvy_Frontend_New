'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { useToast } from '@/app/_components/Toast';
import { Button } from '@/components/ui/button';
import { marked } from 'marked';
import {
  collegeSelectorApi,
  CollegeRecommendation,
  TranscriptData,
} from '@/lib/college-selector-api';
import { downloadPDF } from '@/lib/pdf-from-component';
import CollegeSelectorResultsPDF from '@/components/pdf/CollegeSelectorResultsPDF';
import TranscriptReportPDF from '@/components/pdf/TranscriptReportPDF';
import { useUserAuth } from '@/app/_hooks/useUserAuth';

type TabType = 'results' | 'history';

const FIT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  reach: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  match: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  safe: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
};

function renderMarkdown(content: string): string {
  try {
    return marked.parse(content, { async: false }) as string;
  } catch {
    return content;
  }
}

export default function CollegeSelectorResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string | undefined;
  const { addToast } = useToast();
  const { userDetails } = useUserAuth();

  const [recommendations, setRecommendations] = useState<CollegeRecommendation[]>([]);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingResults, setIsDownloadingResults] = useState(false);
  const [isDownloadingTranscript, setIsDownloadingTranscript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('results');
  const [filterCategory, setFilterCategory] = useState<string>('all');

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

  async function downloadResultsFile() {
    try {
      setIsDownloadingResults(true);

      const firstName = userDetails.first_name || '';
      const lastName = userDetails.last_name || '';
      const studentName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || userDetails.email || 'Student');

      await downloadPDF(
        <CollegeSelectorResultsPDF recommendations={recommendations} studentName={studentName} />,
        `College_Selector_Results_${studentName.replace(/\s+/g, '_')}`,
      );

      addToast('Results downloaded successfully!', { type: 'success' });
    } catch (e) {
      console.error('Failed to download results:', e);
      addToast('Failed to download results', { type: 'error' });
    } finally {
      setIsDownloadingResults(false);
    }
  }

  async function downloadTranscriptFile() {
    if (!sessionId) return;

    try {
      setIsDownloadingTranscript(true);

      // Use existing transcript or fetch it
      let transcriptData = transcript;
      if (!transcriptData) {
        transcriptData = await collegeSelectorApi.getTranscript(sessionId);
      }

      const firstName = userDetails.first_name || '';
      const lastName = userDetails.last_name || '';
      const studentName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || userDetails.email || 'Student');

      const messages = transcriptData.messages || [];
      const paired: { questionNumber: number; phase: string; botQuestion: string; studentResponse: string }[] = [];
      let concludingMessage: string | null = null;

      for (let i = 0; i < messages.length; i++) {
        const m = messages[i];
        if (m.bot_question && m.student_response) {
          paired.push({
            questionNumber: m.question_number || paired.length + 1,
            phase: 'conversation',
            botQuestion: m.bot_question,
            studentResponse: m.student_response,
          });
        } else if (m.bot_question && !m.student_response) {
          concludingMessage = m.bot_question;
        }
      }

      const startedAt = messages.length > 0 ? messages[0].timestamp : undefined;
      const completedAt = messages.length > 0 ? messages[messages.length - 1].timestamp : undefined;

      await downloadPDF(
        <TranscriptReportPDF
          variant="college"
          sessionId={sessionId}
          studentName={studentName}
          startedAt={startedAt}
          completedAt={completedAt}
          totalQuestions={paired.length}
          messages={paired}
          concludingMessage={concludingMessage}
        />,
        `College_Selector_Transcript_${studentName.replace(/\s+/g, '_')}`,
      );

      addToast('Transcript downloaded!', { type: 'success' });
    } catch (e) {
      console.error('Failed to download transcript:', e);
      addToast('Failed to download transcript', { type: 'error' });
    } finally {
      setIsDownloadingTranscript(false);
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
      <div className="flex h-full items-center justify-center bg-linear-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-20 w-20">
            <div className="absolute inset-0 animate-ping rounded-full bg-green-200 opacity-75"></div>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-600"></div>
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            {isGenerating ? 'Generating Your College List' : 'Loading Results'}
          </h2>
          <p className="mb-4 text-gray-600">
            {isGenerating
              ? 'Analyzing 20 colleges based on your preferences...'
              : 'Loading your personalized college recommendations...'}
          </p>
          <div className="mx-auto w-64 overflow-hidden rounded-full bg-gray-200">
            <div className="h-2 animate-pulse rounded-full bg-linear-to-r from-green-500 to-emerald-500" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-linear-to-br from-green-50 to-emerald-50">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 p-3">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Unable to Load Results</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => router.push(`/college-selector/${sessionId}/conversations`)}
              className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Continue Conversation
            </button>
            <button
              onClick={() => loadResults()}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-linear-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            <span className="mr-2">🏫</span> College Selection Complete
          </div>
          <Heading level={1} className="mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Your College Recommendations
          </Heading>
          <Paragraph className="mx-auto max-w-2xl text-lg text-gray-600">
            Based on your preferences and conversation, we&apos;ve identified {recommendations.length} colleges across your selected countries.
          </Paragraph>
        </div>

        {/* Tabs */}
        <div className="mx-auto mb-8 max-w-5xl">
          <div className="inline-flex w-full rounded-lg bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 cursor-pointer rounded-md px-6 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'results'
                  ? 'bg-linear-to-r from-green-500 to-emerald-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">📊</span> College Results
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 cursor-pointer rounded-md px-6 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-linear-to-r from-green-500 to-emerald-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">💬</span> Conversation History
            </button>
          </div>
        </div>

        {activeTab === 'results' ? (
          <>
            {/* Results Summary */}
            <div className="mx-auto mb-8 max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="bg-linear-to-r from-green-500 to-emerald-500 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Results Summary</h3>
                  <Button
                    onClick={downloadResultsFile}
                    disabled={isDownloadingResults}
                    variant="secondary"
                    className="bg-white/20 text-white hover:bg-white/30"
                  >
                    {isDownloadingResults ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-6 flex justify-center gap-4">
                  <div className="rounded-xl bg-green-50 px-8 py-4 text-center">
                    <div className="text-4xl font-bold text-green-600">{recommendations.length}</div>
                    <div className="mt-1 text-sm font-medium text-green-600">Total Colleges</div>
                  </div>
                </div>

                {/* Category Descriptions */}
                <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                    <div className="text-sm font-semibold text-red-700">🎯 Reach</div>
                    <p className="mt-1 text-xs text-red-600">Ambitious choices where your profile is below the typical admitted student. Worth aiming for!</p>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                    <div className="text-sm font-semibold text-green-700">✅ Match</div>
                    <p className="mt-1 text-xs text-green-600">Your academic profile aligns well with the typical admitted student. Strong chance of admission.</p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                    <div className="text-sm font-semibold text-blue-700">🛡️ Safe</div>
                    <p className="mt-1 text-xs text-blue-600">Your profile exceeds the typical requirements. Very likely to be admitted — a reliable backup.</p>
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="mb-6 flex flex-wrap justify-center gap-2">
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

                {/* Horizontal Bar Chart */}
                <div className="space-y-3">
                  {filteredRecs.map((rec, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-56 shrink-0 text-right" title={rec.university_name}>
                        <span className="block truncate text-xs font-medium text-gray-700">
                          {rec.university_name}
                        </span>
                      </div>
                      <div className="h-7 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="flex h-full items-center justify-end rounded-full bg-linear-to-r from-green-500 to-emerald-500 pr-2 transition-all duration-700 ease-out"
                          style={{ width: `${rec.match_percentage}%` }}
                        >
                          <span className="text-xs font-bold whitespace-nowrap text-white">
                            {rec.match_percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendation Cards */}
            <div className="mx-auto max-w-4xl space-y-6">
              {filteredRecs.map((rec, index) => {
                const colors = FIT_COLORS[rec.fit_category] || FIT_COLORS.match;

                return (
                  <div
                    key={rec.university_name + index}
                    className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    {/* Header */}
                    <div className="relative bg-linear-to-r from-green-500 to-emerald-500 p-6 text-white">
                      {/* Rank Badge */}
                      <div className="absolute -left-2 top-6 flex items-center">
                        <div className="rounded-r-full bg-white/20 py-1 pl-4 pr-3 text-sm font-bold backdrop-blur-sm">
                          #{index + 1}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="ml-10 flex items-center space-x-3">
                          <span className="text-3xl">
                            {rec.match_percentage >= 90 ? '🌟' : rec.match_percentage >= 80 ? '🎯' : rec.match_percentage >= 70 ? '✨' : '💡'}
                          </span>
                          <div>
                            <h3 className="text-2xl font-bold">{rec.university_name}</h3>
                            <p className="text-green-100">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.bg} ${colors.text}`}>
                                {rec.fit_category.toUpperCase()}
                              </span>
                              <span className="ml-2 text-sm">{rec.location}, {rec.country}</span>
                            </p>
                          </div>
                        </div>
                        <div className={`rounded-full px-4 py-2 text-sm font-bold ${
                          rec.match_percentage >= 90
                            ? 'bg-white text-emerald-700 ring-2 ring-emerald-400'
                            : rec.match_percentage >= 80
                              ? 'bg-white text-blue-700 ring-2 ring-blue-400'
                              : rec.match_percentage >= 70
                                ? 'bg-white text-amber-700 ring-2 ring-amber-400'
                                : 'bg-white text-gray-600 ring-2 ring-gray-300'
                        }`}>
                          {rec.match_percentage}% Match
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                      {/* Suggested Deadline Callout */}
                      {rec.suggested_deadline && (
                        <div className="mb-6 flex items-center gap-3 rounded-xl bg-linear-to-r from-purple-50 to-indigo-50 border border-purple-200 px-4 py-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                            <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                          <div>
                            <p className="text-xs font-medium text-purple-500 uppercase tracking-wide">Suggested Deadline</p>
                            <p className="text-sm font-semibold text-purple-800">{rec.suggested_deadline}</p>
                          </div>
                        </div>
                      )}
                      <div className="md:columns-2 gap-8 [&>div]:mb-6 [&>div]:break-inside-avoid">
                        {/* Description */}
                        {rec.description && (
                          <div>
                            <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                              <span className="mr-2 rounded-lg bg-green-100 p-1.5">
                                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </span>
                              About This College
                            </h4>
                            <p className="leading-relaxed text-gray-600">{rec.description}</p>
                          </div>
                        )}

                        {/* Fit Reasoning */}
                        {rec.fit_reasoning && (
                          <div>
                            <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                              <span className={`mr-2 rounded-lg p-1.5 ${FIT_COLORS[rec.fit_category]?.bg || 'bg-green-100'}`}>
                                <svg className={`h-4 w-4 ${FIT_COLORS[rec.fit_category]?.text || 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </span>
                              Why This Is a {rec.fit_category.charAt(0).toUpperCase() + rec.fit_category.slice(1)}
                            </h4>
                            <p className={`leading-relaxed rounded-lg p-3 text-sm ${FIT_COLORS[rec.fit_category]?.bg || 'bg-gray-50'} ${FIT_COLORS[rec.fit_category]?.text || 'text-gray-700'}`}>
                              {rec.fit_reasoning}
                            </p>
                          </div>
                        )}

                        {/* Key Details */}
                        <div>
                          <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-2 rounded-lg bg-emerald-100 p-1.5">
                              <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                            Key Details
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <DetailItem label="Degree & Major" value={rec.degree_and_major} />
                            <DetailItem label="Type" value={rec.university_type} />
                            <DetailItem label="Tuition Fees" value={rec.tuition_fees} />
                            <DetailItem label="Cost of Living" value={rec.cost_of_living} />
                            <DetailItem label="Acceptance Rate" value={rec.acceptance_rate} />
                            <DetailItem label="Employment Rate" value={rec.employment_rate} />
                            <DetailItem label="Language" value={rec.language} />
                            <DetailItem label="Campus Type" value={rec.campus_type} />
                          </div>
                        </div>

                        {/* Global Rankings */}
                        {rec.global_ranking && Object.keys(rec.global_ranking).length > 0 && (
                          <div>
                            <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                              <span className="mr-2 rounded-lg bg-amber-100 p-1.5">
                                <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                              </span>
                              Global Rankings
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(rec.global_ranking).map(([system, rank]) => (
                                <span key={system} className="rounded-full bg-linear-to-r from-green-50 to-emerald-50 px-3 py-1.5 text-sm font-medium text-green-700 shadow-sm">
                                  {system}: {rank}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Scholarships */}
                        {rec.scholarships && rec.scholarships.length > 0 && (
                          <div>
                            <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                              <span className="mr-2 rounded-lg bg-emerald-100 p-1.5">
                                <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </span>
                              Scholarships
                            </h4>
                            <ul className="space-y-2">
                              {rec.scholarships.map((s, i) => (
                                <li key={i} className="flex items-start space-x-3 rounded-lg bg-gray-50 p-3">
                                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-gray-700">{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tests Required */}
                        {rec.tests_required && rec.tests_required.length > 0 && (
                          <div>
                            <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                              <span className="mr-2 rounded-lg bg-blue-100 p-1.5">
                                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              </span>
                              Tests Required
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {rec.tests_required.map((t, i) => (
                                <span key={i} className="rounded-full bg-linear-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-sm font-medium text-amber-700 shadow-sm">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Application Deadlines */}
                        {rec.deadlines && Object.keys(rec.deadlines).length > 0 && (
                          <div>
                            <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                              <span className="mr-2 rounded-lg bg-purple-100 p-1.5">
                                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </span>
                              Application Deadlines
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(rec.deadlines).map(([round, date]) => (
                                <span key={round} className="rounded-full bg-linear-to-r from-purple-50 to-indigo-50 px-3 py-1.5 text-sm font-medium text-purple-700 shadow-sm">
                                  {round}: {date}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional Requirements */}
                        {rec.additional_requirements && rec.additional_requirements.length > 0 && (
                          <div>
                            <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                              <span className="mr-2 rounded-lg bg-green-100 p-1.5">
                                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                              Additional Requirements
                            </h4>
                            <ul className="space-y-3">
                              {rec.additional_requirements.map((r, i) => (
                                <li key={i} className="flex items-start space-x-3">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600">
                                    {i + 1}
                                  </span>
                                  <span className="text-gray-700">{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Post-Study & Support */}
                        {(rec.post_study_work_visa || rec.intl_student_support || rec.application_fee) && (
                          <div>
                            <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                              <span className="mr-2 rounded-lg bg-emerald-100 p-1.5">
                                <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </span>
                              Additional Info
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              <DetailItem label="Post-Study Work Visa" value={rec.post_study_work_visa} />
                              <DetailItem label="Int'l Student Support" value={rec.intl_student_support} />
                              <DetailItem label="Application Fee" value={rec.application_fee} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Website Link */}
                      {rec.website_url && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
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
        ) : (
          /* Conversation History Tab */
          <div className="mx-auto max-w-4xl">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent"></div>
                <span className="ml-3 text-gray-600">Loading conversation history...</span>
              </div>
            ) : transcript?.messages && transcript.messages.length > 0 ? (
              <div className="space-y-4 rounded-lg bg-white p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                  <Heading level={3} className="text-lg font-semibold text-gray-900">
                    Full Conversation Transcript
                  </Heading>
                  <Button
                    onClick={downloadTranscriptFile}
                    disabled={isDownloadingTranscript}
                    className="bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    {isDownloadingTranscript ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        📄 Download Transcript
                      </>
                    )}
                  </Button>
                </div>
                <div className="space-y-6">
                  {transcript.messages.map((msg) => (
                    <div key={msg.question_number} className="border-l-4 border-green-500 bg-gray-50 p-4">
                      <div className="mb-4">
                        <div className="mb-2 flex items-center">
                          <span className="inline-block rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                            Q{msg.question_number}
                          </span>
                          {msg.timestamp && (
                            <span className="ml-auto text-xs text-gray-500">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                        {msg.bot_question && (
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-gray-900">College Advisor:</p>
                            <div
                              className="mt-1 text-gray-700 prose prose-sm max-w-none [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-3 [&_h3]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h4]:mt-2 [&_h4]:mb-1 [&_p]:mt-0 [&_p]:mb-2 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_em]:italic [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-0.5 [&_a]:text-emerald-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-3 [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_hr]:my-4 [&_hr]:border-gray-200 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-sm [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:shadow-md [&_table]:border [&_table]:border-gray-200 [&_thead]:bg-linear-to-r [&_thead]:from-emerald-600 [&_thead]:to-green-500 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-white [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:border-0 [&_th]:border-b [&_th]:border-emerald-400/30 [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-150 [&_tbody_tr:hover]:bg-emerald-50 [&_tbody_tr:nth-child(even)]:bg-gray-50/60 [&_tbody_tr:nth-child(even):hover]:bg-emerald-50 [&_td]:px-4 [&_td]:py-3 [&_td]:border-0 [&_td]:border-b [&_td]:border-gray-100 [&_td:first-child]:font-semibold [&_td:first-child]:text-gray-800 [&_tbody_tr:last-child_td]:border-b-0"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.bot_question) }}
                            />
                          </div>
                        )}
                        {msg.student_response && (
                          <div>
                            <p className="text-sm font-semibold text-gray-900">You:</p>
                            <p className="mt-1 text-gray-700">{msg.student_response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-white p-8 text-center shadow-lg">
                <p className="text-gray-600">No conversation history available.</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 space-x-4 text-center">
          <Button
            asChild
            size="lg"
            className="bg-linear-to-r from-green-500 to-emerald-500 font-semibold hover:from-green-600 hover:to-emerald-600"
          >
            <Link href="/college-selector">🏫 Back to College Selector</Link>
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
