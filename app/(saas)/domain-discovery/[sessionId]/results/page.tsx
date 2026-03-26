'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { useToast } from '@/app/_components/Toast';
import { Button } from '@/components/ui/button';
import {
  domainDiscoveryApi,
  DomainRecommendation,
  ResultsSummary,
  InterestScores,
  TranscriptData,
  TranscriptMessage,
} from '@/lib/domain-discovery-api';
import { downloadPDF } from '@/lib/pdf-from-component';
import DomainResultsPDF from '@/components/pdf/DomainResultsPDF';
import TranscriptReportPDF from '@/components/pdf/TranscriptReportPDF';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';
import { useUserAuth } from '@/app/_hooks/useUserAuth';
import { DomainDebugDialog } from '@/components/DomainDebugDialog';

type Role = 'bot' | 'user';

interface Message {
  message_id: string;
  type: Role;
  content: string;
  timestamp: string;
}

type TabType = 'results' | 'history';

/** ================== Component ================== */
const DomainResultsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string | undefined;
  const { addToast } = useToast();
  const { personalDetails, educationalDetails } = useProfile();
  const { userDetails } = useUserAuth();

  const [recommendations, setRecommendations] = useState<DomainRecommendation[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [interestScores, setInterestScores] = useState<InterestScores | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isDownloadingTranscript, setIsDownloadingTranscript] = useState(false);
  const [isDownloadingResults, setIsDownloadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('results');
  const [showDebugDialog, setShowDebugDialog] = useState(false);

  // Load results on mount
  useEffect(() => {
    if (sessionId) {
      loadResults();
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

  async function loadResults() {
    try {
      setIsLoading(true);
      setError(null);

      if (!sessionId) {
        setError('No session found. Please complete the Stream & Subject Selection first.');
        addToast('No session data found.', { type: 'warning' });
        setIsLoading(false);
        return;
      }

      // Fetch comprehensive results from new endpoint
      const results: ResultsSummary = await domainDiscoveryApi.getResultsSummary(sessionId);

      setRecommendations([...results.primary_domains, ...results.secondary_domains]);
      setInterestScores(results.riasec_scores);
      setInterests(results.interests_identified);
      
      // addToast('Results loaded successfully!', { type: 'success' });
    } catch (e) {
      console.error('Failed to load results:', e);
      setError('Failed to load results. Please try again.');
      addToast('Failed to load results', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadConversationHistory() {
    if (!sessionId) return;
    
    try {
      setIsLoadingHistory(true);
      const transcriptData: TranscriptData = await domainDiscoveryApi.getTranscript(sessionId);
      setTranscript(transcriptData);
      addToast('Transcript loaded!', { type: 'success' });
    } catch (e) {
      console.error('Failed to load transcript:', e);
      addToast('Failed to load transcript', { type: 'error' });
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function downloadTranscriptFile() {
    if (!sessionId) return;

    try {
      setIsDownloadingTranscript(true);
      
      // Use existing transcript data if available, otherwise fetch it
      let transcriptData = transcript;
      if (!transcriptData) {
        transcriptData = await domainDiscoveryApi.getTranscript(sessionId);
      }

      // Get student name from profile, falling back to transcript data
      const firstName = (personalDetails?.firstName as string) || '';
      const lastName = (personalDetails?.lastName as string) || '';
      const studentName = firstName && lastName
        ? `${firstName} ${lastName}`
        : (firstName || lastName || transcriptData.student_name || userDetails.email || 'Student');
      
      // Convert to Q&A pairs
      const paired = (transcriptData.messages || []).map((m, i) => ({
        questionNumber: m.question_number || i + 1,
        phase: m.phase || 'general',
        botQuestion: m.bot_question || '',
        studentResponse: m.student_response || '',
      }));

      await downloadPDF(
        <TranscriptReportPDF
          variant="domain"
          sessionId={sessionId}
          studentName={studentName}
          startedAt={transcriptData.started_at}
          completedAt={transcriptData.completed_at}
          totalQuestions={transcriptData.total_questions || paired.length}
          messages={paired}
          concludingMessage={transcriptData.concluding_message}
        />,
        `Domain_Discovery_Transcript_${studentName.replace(/\s+/g, '_')}`,
      );
      
      addToast('Transcript downloaded!', { type: 'success' });
    } catch (e) {
      console.error('Failed to download transcript:', e);
      addToast('Failed to download transcript', { type: 'error' });
    } finally {
      setIsDownloadingTranscript(false);
    }
  }

  async function downloadResultsFile() {
    try {
      setIsDownloadingResults(true);

      const firstName = (personalDetails?.firstName as string) || '';
      const lastName = (personalDetails?.lastName as string) || '';
      const studentName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || userDetails.email || 'Student');

      await downloadPDF(
        <DomainResultsPDF
          recommendations={recommendations}
          interests={interests}
          strengths={[]}
          studentName={studentName}
        />,
        `Domain_Discovery_Results_${studentName.replace(/\s+/g, '_')}`,
      );

      addToast('Results downloaded successfully!', { type: 'success' });
    } catch (e) {
      console.error('Failed to download results:', e);
      addToast('Failed to download results', { type: 'error' });
    } finally {
      setIsDownloadingResults(false);
    }
  }

  const handleTryAgain = async () => {
    if (!sessionId) {
      router.push('/domain-discovery');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await domainDiscoveryApi.generateRecommendations(sessionId);
      if (result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations);
      } else {
        setError('No domain recommendations were generated. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load domain recommendations. Please try again.');
      addToast('Failed to load domain recommendations', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'STEM': 'bg-blue-100 text-blue-700',
      'Arts': 'bg-pink-100 text-pink-700',
      'Humanities': 'bg-amber-100 text-amber-700',
      'Business': 'bg-emerald-100 text-emerald-700',
      'Social Sciences': 'bg-purple-100 text-purple-700',
      'Life Sciences': 'bg-green-100 text-green-700',
      'Creative Arts': 'bg-rose-100 text-rose-700',
      'Health & Wellness': 'bg-red-100 text-red-700',
    };
    return colorMap[category] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-linear-to-br from-[#ebf2ff] to-[#e8fafa]">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-20 w-20">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#c2d6ff] opacity-75"></div>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#c2d6ff] border-t-[#3377ff]"></div>
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Analyzing Your Responses
          </h2>
          <p className="mb-4 text-gray-600">
            Generating personalized domain recommendations...
          </p>
          <div className="mx-auto w-64 overflow-hidden rounded-full bg-gray-200">
            <div className="h-2 animate-pulse rounded-full bg-linear-to-r from-[#3377ff] to-[#14cecf]" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-linear-to-br from-[#ebf2ff] to-[#e8fafa]">
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
            <Button
              asChild
              className="bg-[#3377ff] hover:bg-[#2860d9]"
            >
              <Link href={`/domain-discovery/${sessionId}/conversations`}>
                Continue Conversation
              </Link>
            </Button>
            <Button
              onClick={handleTryAgain}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-linear-to-br from-[#ebf2ff] via-white to-[#e8fafa]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-[#d6e4ff] px-4 py-2 text-sm font-medium text-[#3377ff]">
            <span className="mr-2">🧭</span> Stream & Subject Selection Complete
          </div>
          <Heading level={1} className="mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Your Domain Recommendations
          </Heading>
          <Paragraph className="mx-auto max-w-2xl text-lg text-gray-600">
            Based on your interests and curiosities, we've identified domains that align with your passions and learning style.
          </Paragraph>
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowDebugDialog(true)}
              className="group flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-all hover:border-purple-300 hover:bg-purple-100 hover:shadow-sm"
              title="View debugging information"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Debug</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto mb-8 max-w-5xl">
          <div className="inline-flex w-full rounded-lg bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 cursor-pointer rounded-md px-6 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'results'
                  ? 'bg-linear-to-r from-[#3377ff] to-[#14cecf] text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">📊</span> Domain Results
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 cursor-pointer rounded-md px-6 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-linear-to-r from-[#3377ff] to-[#14cecf] text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">💬</span> Conversation History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'results' ? (
          <>
            {/* Interest Profile Chart - DISABLED (RIASEC removed) */}
            {/* The interest profile section has been disabled as RIASEC analysis is no longer included. */}

            {/* Summary Stats */}
            <div className="mx-auto mb-8 max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="bg-linear-to-r from-[#3377ff] to-[#14cecf] px-6 py-4">
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
              <div className="flex justify-center mb-6">
                <div className="rounded-xl bg-[#ebf2ff] px-8 py-4 text-center">
                  <div className="text-4xl font-bold text-[#3377ff]">
                    {recommendations.length}
                  </div>
                  <div className="mt-1 text-sm font-medium text-[#3377ff]">Domain Matches</div>
                </div>
              </div>

              {/* Horizontal Bar Chart */}
              <div className="space-y-3">
                {recommendations.map((domain, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-56 shrink-0 text-right" title={domain.domain_title}>
                      <span className="text-xs font-medium text-gray-700 truncate block">
                        {domain.domain_title}
                      </span>
                    </div>
                    <div className="flex-1 h-7 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-[#3377ff] to-[#14cecf] transition-all duration-700 ease-out flex items-center justify-end pr-2"
                        style={{ width: `${domain.match_percentage}%` }}
                      >
                        <span className="text-xs font-bold text-white whitespace-nowrap">
                          {domain.match_percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interests */}
              {interests.length > 0 && (
                <div className="mt-6">
                    <div className="rounded-xl bg-[#ebf2ff] p-4">
                      <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                        <span className="mr-2 rounded-lg bg-[#d6e4ff] p-1.5">
                          <svg className="h-4 w-4 text-[#3377ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </span>
                        Your Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {interests.map((interest, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-[#3377ff] shadow-sm"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                </div>
              )}
              </div>
            </div>

            {/* Recommendation Cards */}
            <div className="mx-auto max-w-4xl space-y-6">
              {recommendations.map((domain, index) => (
                <div
                  key={index}
                  className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                >
                  {/* Header */}
                  <div className="relative bg-linear-to-r from-[#3377ff] to-[#14cecf] p-6 text-white">
                    {/* Rank Badge */}
                    <div className="absolute -left-2 top-6 flex items-center">
                      <div className="rounded-r-full bg-white/20 py-1 pl-4 pr-3 text-sm font-bold backdrop-blur-sm">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="ml-10 flex items-center space-x-3">
                        <span className="text-3xl">
                          {domain.match_percentage >= 90
                            ? '🌟'
                            : domain.match_percentage >= 80
                              ? '🎯'
                              : domain.match_percentage >= 70
                                ? '✨'
                                : '💡'}
                        </span>
                        <div>
                          <h3 className="text-2xl font-bold">
                            {domain.domain_title}
                          </h3>
                          <p className="text-[#d6e4ff]">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryColor(domain.category)}`}>
                              {domain.category}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div
                        className={`rounded-full px-4 py-2 text-sm font-bold ${
                          domain.match_percentage >= 90
                            ? 'bg-white text-emerald-700 ring-2 ring-emerald-400'
                            : domain.match_percentage >= 80
                              ? 'bg-white text-blue-700 ring-2 ring-blue-400'
                              : domain.match_percentage >= 70
                                ? 'bg-white text-amber-700 ring-2 ring-amber-400'
                                : 'bg-white text-gray-600 ring-2 ring-gray-300'
                        }`}
                      >
                        {domain.match_percentage}% Match
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <div className="grid gap-8 md:grid-cols-2">
                      <div className="space-y-6">
                        <div>
                          <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-2 rounded-lg bg-[#d6e4ff] p-1.5">
                              <svg className="h-4 w-4 text-[#3377ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                            Domain Overview
                          </h4>
                          <p className="leading-relaxed text-gray-600">
                            {domain.description}
                          </p>
                        </div>

                        <div>
                          <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-2 rounded-lg bg-[#d0f5f5] p-1.5">
                              <svg className="h-4 w-4 text-[#14cecf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                            Why This Domain Fits You
                          </h4>
                          <p className="leading-relaxed text-gray-600">
                            {domain.why_recommended}
                          </p>
                        </div>

                        <div>
                          <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-2 rounded-lg bg-amber-100 p-1.5">
                              <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </span>
                            Your Key Interests
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {domain.key_interests && domain.key_interests.length > 0 ? (
                              domain.key_interests.map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-full bg-linear-to-r from-[#d6e4ff] to-[#d0f5f5] px-3 py-1.5 text-sm font-medium text-[#3377ff] shadow-sm"
                                >
                                  {interest}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500 italic">
                                No specific interests identified for this domain
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-2 rounded-lg bg-blue-100 p-1.5">
                              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </span>
                            Related Subjects
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {domain.related_subjects && domain.related_subjects.length > 0 ? (
                              domain.related_subjects.map((subject, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm"
                                >
                                  {subject}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500 italic">
                                No specific subjects identified for this domain
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-2 rounded-lg bg-[#d0f5f5] p-1.5">
                              <svg className="h-4 w-4 text-[#14cecf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                              </svg>
                            </span>
                            Sub-Domains to Explore
                          </h4>
                          {domain.sub_domains && domain.sub_domains.length > 0 ? (
                            <ul className="space-y-2">
                              {domain.sub_domains.map((subDomain, idx) => (
                                <li key={idx} className="flex items-start space-x-3 rounded-lg bg-gray-50 p-3">
                                  <svg
                                    className="mt-0.5 h-5 w-5 shrink-0 text-[#14cecf]"
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
                                  <span className="text-gray-700">{subDomain}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              No specific sub-domains identified for this domain
                            </p>
                          )}
                        </div>

                        <div>
                          <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-2 rounded-lg bg-[#d6e4ff] p-1.5">
                              <svg className="h-4 w-4 text-[#40c795]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </span>
                            Exploration Activities
                          </h4>
                          {domain.exploration_activities && domain.exploration_activities.length > 0 ? (
                            <ul className="space-y-3">
                              {domain.exploration_activities.map((activity, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start space-x-3"
                                >
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d6e4ff] text-xs font-bold text-[#40c795]">
                                    {idx + 1}
                                  </span>
                                  <span className="text-gray-700">{activity}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              No specific exploration activities identified for this domain
                            </p>
                          )}
                        </div>

                        <div>
                          <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-2 rounded-lg bg-[#e9d5ff] p-1.5">
                              <svg className="h-4 w-4 text-[#7f12f3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </span>
                            Potential Career Paths
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {domain.potential_careers && domain.potential_careers.length > 0 ? (
                              domain.potential_careers.map((career, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-full bg-linear-to-r from-[#e9d5ff] to-[#fce7f3] px-3 py-1.5 text-sm font-medium text-[#7f12f3] shadow-sm"
                                >
                                  {career}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500 italic">
                                No specific career paths identified for this domain
                              </span>
                            )}
                          </div>
                        </div>
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
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3377ff] border-t-transparent"></div>
                <span className="ml-3 text-gray-600">
                  Loading conversation history...
                </span>
              </div>
            ) : transcript && transcript.messages.length > 0 ? (
              <div className="space-y-4 rounded-lg bg-white p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                  <Heading level={3} className="text-lg font-semibold text-gray-900">
                    Full Conversation Transcript
                  </Heading>
                  <Button
                    onClick={downloadTranscriptFile}
                    disabled={isDownloadingTranscript}
                    className="bg-linear-to-r from-[#3377ff] to-[#14cecf] hover:from-[#2860d9] hover:to-[#0fa5a5]"
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
                  {transcript.messages.map((message) => (
                    <div key={message.question_number} className="border-l-4 border-[#3377ff] bg-gray-50 p-4">
                      <div className="mb-4">
                        <div className="mb-2 flex items-center">
                          <span className="inline-block rounded-full bg-[#3377ff] px-3 py-1 text-xs font-semibold text-white">
                            Q{message.question_number}
                          </span>
                          {message.timestamp && (
                            <span className="ml-auto text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-900">Domain Coach:</p>
                          <p className="mt-1 text-gray-700">{message.bot_question}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">You:</p>
                          <p className="mt-1 text-gray-700">{message.student_response}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Concluding message from the AI Coach */}
                  {transcript.concluding_message && (
                    <div className="border-l-4 border-green-500 bg-green-50 p-4">
                      <div className="mb-2 flex items-center">
                        <span className="inline-block rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                          Session Complete
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Domain Coach:</p>
                        <p className="mt-1 text-gray-700">{transcript.concluding_message}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-white p-8 text-center shadow-lg">
                <p className="text-gray-600">No conversation history found.</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 space-x-4 text-center">
          {/* <Button
            asChild
            size="lg"
            className="bg-linear-to-r from-teal-600 to-cyan-600 font-semibold hover:from-teal-700 hover:to-cyan-700"
          >
            <Link href="/domain-discovery">Discover More Domains</Link>
          </Button> */}
          <Button
            asChild
            size="lg"
            className="bg-linear-to-r from-[#7f12f3] to-[#1a86f1] font-semibold hover:from-[#6a0fd0] hover:to-[#1570d0]"
          >
            <Link href="/career-discovery">🚀 Start Career & Degree Selection </Link>
          </Button>
          {/* <Button
            onClick={downloadResultsFile}
            disabled={isDownloadingResults}
            variant="outline"
            size="lg"
            className="font-semibold"
          >
            {isDownloadingResults ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
                Downloading...
              </>
            ) : (
              <>📄 Download Results</>
            )}
          </Button> */}
        </div>
      </div>

      {/* Debug Dialog */}
      {sessionId && (
        <DomainDebugDialog
          open={showDebugDialog}
          onOpenChange={setShowDebugDialog}
          sessionId={sessionId}
          isTimerExpired={false}
          debugOverrideTimerBlock={false}
          onDebugOverrideTimerBlockChange={() => {}}
        />
      )}
    </div>
  );
};

export default DomainResultsPage;
