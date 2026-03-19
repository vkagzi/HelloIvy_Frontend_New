'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { useToast } from '@/app/_components/Toast';
import { Button } from '@/components/ui/button';
import {
  careerDiscoveryApi,
  CareerRecommendation,
  CareerMessage,
} from '@/lib/career-discovery-api';
import {
  generateCareerTranscriptPDF,
  CareerTranscriptData,
} from '@/lib/pdf-utils';
import { downloadPDF } from '@/lib/pdf-from-component';
import CareerResultsPDF from '@/components/pdf/CareerResultsPDF';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';

type TabType = 'results' | 'history';

/** ================== Component ================== */
const CareerResultsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string | undefined;
  const { addToast } = useToast();
  const { personalDetails, educationalDetails } = useProfile();

  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [conversationHistory, setConversationHistory] = useState<CareerMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isDownloadingTranscript, setIsDownloadingTranscript] = useState(false);
  const [isDownloadingResults, setIsDownloadingResults] = useState(false);
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

  async function downloadTranscriptFile() {
    if (!sessionId) return;

    try {
      setIsDownloadingTranscript(true);
      
      // Use existing conversation history or fetch it
      let messages = conversationHistory;
      if (messages.length === 0) {
        const historyResponse = await careerDiscoveryApi.getMessages(sessionId);
        messages = historyResponse.messages;
      }
      
      // Get student name from profile
      const firstName = (personalDetails?.firstName as string) || '';
      const lastName = (personalDetails?.lastName as string) || '';
      const studentName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || 'Student');
      
      // Find session timestamps from messages
      const sortedMessages = [...messages].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const startedAt = sortedMessages.length > 0 ? sortedMessages[0].timestamp : undefined;
      const completedAt = sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].timestamp : undefined;
      
      const transcriptData: CareerTranscriptData = {
        session_id: sessionId,
        student_name: studentName,
        started_at: startedAt,
        completed_at: completedAt,
        total_questions: messages.filter(m => m.type === 'bot').length,
        messages: messages,
      };
      
      // Generate PDF on the frontend
      const pdfBlob = generateCareerTranscriptPDF(transcriptData);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Career_Discovery_Transcript_${studentName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
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
      const studentName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || 'Student');

      await downloadPDF(
        <CareerResultsPDF recommendations={recommendations} studentName={studentName} />,
        `Career_Discovery_Results_${studentName.replace(/\s+/g, '_')}`,
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
      <div className="flex h-full items-center justify-center bg-linear-to-br from-[#f3e8ff] to-[#ebf2ff]">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-20 w-20">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#d8b4fe] opacity-75"></div>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8b4fe] border-t-[#7f12f3]"></div>
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Analyzing Your Career Profile
          </h2>
          <p className="mb-4 text-gray-600">
            Generating personalized career recommendations...
          </p>
          <div className="mx-auto w-64 overflow-hidden rounded-full bg-gray-200">
            <div className="h-2 animate-pulse rounded-full bg-linear-to-r from-[#7f12f3] to-[#1a86f1]" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-linear-to-br from-[#f3e8ff] to-[#ebf2ff]">
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
              className="cursor-pointer rounded-lg bg-[#7f12f3] px-4 py-2 text-white hover:bg-[#6a0fd0]"
            >
              Continue Conversation
            </button>
            <button
              onClick={handleTryAgain}
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
    <div className="min-h-full bg-linear-to-br from-[#f3e8ff] via-white to-[#ebf2ff]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-[#e9d5ff] px-4 py-2 text-sm font-medium text-[#7f12f3]">
            <span className="mr-2">🎯</span> Career Discovery Complete
          </div>
          <Heading level={1} className="mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Your Career Recommendations
          </Heading>
          <Paragraph className="mx-auto max-w-2xl text-lg text-gray-600">
            Based on your conversation, we've identified career paths that align with your interests, skills, and aspirations.
          </Paragraph>
        </div>

        {/* Tabs */}
        <div className="mx-auto mb-8 max-w-5xl">
          <div className="inline-flex w-full rounded-lg bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 cursor-pointer rounded-md px-6 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'results'
                  ? 'bg-linear-to-r from-[#7f12f3] to-[#1a86f1] text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">📊</span> Career Results
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 cursor-pointer rounded-md px-6 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-linear-to-r from-[#7f12f3] to-[#1a86f1] text-white shadow-md'
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
            {/* Results Summary Header with Download Button */}
            <div className="mx-auto mb-8 max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="bg-linear-to-r from-[#7f12f3] to-[#1a86f1] px-6 py-4">
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
                  <div className="rounded-xl bg-[#f3e8ff] px-8 py-4 text-center">
                    <div className="text-4xl font-bold text-[#7f12f3]">
                      {recommendations.length}
                    </div>
                    <div className="mt-1 text-sm font-medium text-[#7f12f3]">Career Matches</div>
                  </div>
                </div>

                {/* Horizontal Bar Chart */}
                <div className="space-y-3">
                  {recommendations.map((career, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-56 shrink-0 text-right" title={career.career_title}>
                        <span className="text-xs font-medium text-gray-700 truncate block">
                          {career.career_title}
                        </span>
                      </div>
                      <div className="flex-1 h-7 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-[#7f12f3] to-[#1a86f1] transition-all duration-700 ease-out flex items-center justify-end pr-2"
                          style={{ width: `${career.match_percentage}%` }}
                        >
                          <span className="text-xs font-bold text-white whitespace-nowrap">
                            {career.match_percentage}%
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
              {recommendations.map((career, index) => (
                <div
                  key={index}
                  className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                >
                  {/* Header */}
                  <div className="relative bg-linear-to-r from-[#7f12f3] to-[#1a86f1] p-6 text-white">
                    {/* Rank Badge */}
                    <div className="absolute -left-2 top-6 flex items-center">
                      <div className="rounded-r-full bg-white/20 py-1 pl-4 pr-3 text-sm font-bold backdrop-blur-sm">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="ml-10 flex items-center space-x-3">
                        <span className="text-3xl">
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
                          <p className="text-[#e9d5ff]">
                            <span className="inline-flex items-center">
                              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {career.salary_range}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div
                        className={`rounded-full px-4 py-2 text-sm font-bold ${
                          career.match_percentage >= 90
                            ? 'bg-white text-emerald-700 ring-2 ring-emerald-400'
                            : career.match_percentage >= 80
                              ? 'bg-white text-blue-700 ring-2 ring-blue-400'
                              : career.match_percentage >= 70
                                ? 'bg-white text-amber-700 ring-2 ring-amber-400'
                                : 'bg-white text-gray-600 ring-2 ring-gray-300'
                        }`}
                      >
                        {career.match_percentage}% Match
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <div className="grid gap-8 md:grid-cols-2">
                      <div className="space-y-6">
                        <div>
                          <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-2 rounded-lg bg-[#e9d5ff] p-1.5">
                              <svg className="h-4 w-4 text-[#7f12f3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                            Career Overview
                          </h4>
                          <p className="leading-relaxed text-gray-600">
                            {career.description}
                          </p>
                        </div>

                        <div>
                          <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-2 rounded-lg bg-[#d0f5f5] p-1.5">
                              <svg className="h-4 w-4 text-[#40c795]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                            Why This Career Fits You
                          </h4>
                          <p className="leading-relaxed text-gray-600">
                            {career.why_recommended}
                          </p>
                        </div>

                        {/* Day in the Life */}
                        {career.day_in_life && (
                          <div>
                            <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                              <span className="mr-2 rounded-lg bg-[#dbeafe] p-1.5">
                                <svg className="h-4 w-4 text-[#3739fd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </span>
                              A Day in the Life
                            </h4>
                            <p className="leading-relaxed text-gray-600">
                              {career.day_in_life}
                            </p>
                          </div>
                        )}

                        <div>
                          <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-2 rounded-lg bg-[#dbeafe] p-1.5">
                              <svg className="h-4 w-4 text-[#1a86f1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            How This Matches Your Interests
                          </h4>
                          <ul className="space-y-2">
                            {career.alignment_points?.map((point, idx) => (
                              <li key={idx} className="flex items-start space-x-3 rounded-lg bg-gray-50 p-3">
                                <svg
                                  className="mt-0.5 h-5 w-5 shrink-0 text-[#7f12f3]"
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
                                <span className="text-gray-700">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                      </div>

                      <div className="space-y-6">
                        <div>
                          <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-2 rounded-lg bg-amber-100 p-1.5">
                              <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </span>
                            Required Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {career.required_skills.map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="rounded-full bg-linear-to-r from-[#e9d5ff] to-[#dbeafe] px-3 py-1.5 text-sm font-medium text-[#7f12f3] shadow-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Related Subjects */}
                        {career.related_subjects?.length > 0 && (
                          <div>
                            <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                              <span className="mr-2 rounded-lg bg-[#dbeafe] p-1.5">
                                <svg className="h-4 w-4 text-[#1a86f1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              </span>
                              Related Subjects
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {career.related_subjects.map((subject, subjIndex) => (
                                <span
                                  key={subjIndex}
                                  className="rounded-full bg-linear-to-r from-[#dbeafe] to-[#e9d5ff] px-3 py-1.5 text-sm font-medium text-[#1a86f1] shadow-sm"
                                >
                                  {subject}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-2 rounded-lg bg-[#d0f5f5] p-1.5">
                              <svg className="h-4 w-4 text-[#40c795]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </span>
                            Next Steps
                          </h4>
                          <ul className="space-y-3">
                            {career.next_steps.map((step, stepIndex) => (
                              <li
                                key={stepIndex}
                                className="flex items-start space-x-3"
                              >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d0f5f5] text-xs font-bold text-[#40c795]">
                                  {stepIndex + 1}
                                </span>
                                <span className="text-gray-700">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Pros and Cons */}
                        {career.pros_and_cons && (career.pros_and_cons.pros?.length > 0 || career.pros_and_cons.cons?.length > 0) && (
                          <div>
                            <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                              <span className="mr-2 rounded-lg bg-orange-100 p-1.5">
                                <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                              </span>
                              Pros &amp; Cons
                            </h4>
                            <div className="grid gap-4 grid-cols-1">
                              {career.pros_and_cons.pros?.length > 0 && (
                                <div className="rounded-lg bg-green-50 p-4">
                                  <h5 className="mb-2 font-semibold text-green-800">Pros</h5>
                                  <ul className="space-y-2">
                                    {career.pros_and_cons.pros.map((pro, idx) => (
                                      <li key={idx} className="flex items-start space-x-2">
                                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-sm text-green-700">{pro}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {career.pros_and_cons.cons?.length > 0 && (
                                <div className="rounded-lg bg-red-50 p-4">
                                  <h5 className="mb-2 font-semibold text-red-800">Cons</h5>
                                  <ul className="space-y-2">
                                    {career.pros_and_cons.cons.map((con, idx) => (
                                      <li key={idx} className="flex items-start space-x-2">
                                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        <span className="text-sm text-red-700">{con}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Work-Life Balance */}
                        {career.work_life_balance && (
                          <div>
                            <h4 className="mb-3 flex items-center text-lg font-semibold text-gray-900">
                              <span className="mr-2 rounded-lg bg-[#d0f5f5] p-1.5">
                                <svg className="h-4 w-4 text-[#14cecf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </span>
                              Work-Life Balance
                            </h4>
                            <p className="leading-relaxed text-gray-600">
                              {career.work_life_balance}
                            </p>
                          </div>
                        )}

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
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7f12f3] border-t-transparent"></div>
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
                <div className="mb-6 flex items-center justify-between">
                  <Heading level={3} className="text-lg font-semibold text-gray-900">
                    Full Conversation Transcript
                  </Heading>
                  <Button
                    onClick={downloadTranscriptFile}
                    disabled={isDownloadingTranscript}
                    className="bg-linear-to-r from-[#7f12f3] to-[#1a86f1] hover:from-[#6a0fd0] hover:to-[#1570d0]"
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
                  {(() => {
                    // Group messages into Q&A pairs
                    const qaPairs: { questionNumber: number; botQuestion: string; studentResponse: string; timestamp?: string }[] = [];
                    let questionNumber = 0;
                    for (let i = 0; i < conversationHistory.length; i++) {
                      const msg = conversationHistory[i];
                      if (msg.type === 'bot') {
                        questionNumber++;
                        const userResponse = conversationHistory[i + 1];
                        qaPairs.push({
                          questionNumber,
                          botQuestion: msg.content,
                          studentResponse: userResponse?.type === 'user' ? userResponse.content : '',
                          timestamp: msg.timestamp,
                        });
                        if (userResponse?.type === 'user') i++;
                      }
                    }
                    return qaPairs.map((qa) => (
                      <div key={qa.questionNumber} className="border-l-4 border-[#7f12f3] bg-gray-50 p-4">
                        <div className="mb-4">
                          <div className="mb-2 flex items-center">
                            <span className="inline-block rounded-full bg-[#7f12f3] px-3 py-1 text-xs font-semibold text-white">
                              Q{qa.questionNumber}
                            </span>
                            {qa.timestamp && (
                              <span className="ml-auto text-xs text-gray-500">
                                {new Date(qa.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-gray-900">Career Coach:</p>
                            <p className="mt-1 text-gray-700">{qa.botQuestion}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">You:</p>
                            <p className="mt-1 text-gray-700">{qa.studentResponse}</p>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 space-x-4 text-center">
          <Button
            asChild
            size="lg"
            className="bg-linear-to-r from-[#7f12f3] to-[#1a86f1] font-semibold hover:from-[#6a0fd0] hover:to-[#1570d0]"
          >
            <Link href="/career-discovery">🎯 Discover More Careers</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CareerResultsPage;
