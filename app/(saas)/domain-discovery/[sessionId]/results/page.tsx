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
import { generateTranscriptPDF, generateDomainResultsPDF, DomainResultsData } from '@/lib/pdf-utils';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';

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

  const [recommendations, setRecommendations] = useState<DomainRecommendation[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [interestScores, setInterestScores] = useState<InterestScores | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isDownloadingTranscript, setIsDownloadingTranscript] = useState(false);
  const [isDownloadingResults, setIsDownloadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('results');

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
        setError('No session found. Please complete the domain discovery first.');
        addToast('No session data found.', { type: 'warning' });
        setIsLoading(false);
        return;
      }

      // Fetch comprehensive results from new endpoint
      const results: ResultsSummary = await domainDiscoveryApi.getResultsSummary(sessionId);

      setRecommendations([...results.primary_domains, ...results.secondary_domains]);
      setInterestScores(results.riasec_scores);
      setInterests(results.interests_identified);
      setStrengths(results.strengths_identified);
      
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
      
      // Generate PDF on the frontend
      const pdfBlob = generateTranscriptPDF(transcriptData);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Domain_Discovery_Transcript_${transcriptData.student_name.replace(/\s+/g, '_')}.pdf`;
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
    if (!sessionId) return;

    try {
      setIsDownloadingResults(true);
      
      // Fetch transcript data if not already loaded to get timestamps
      let transcriptData = transcript;
      if (!transcriptData) {
        try {
          transcriptData = await domainDiscoveryApi.getTranscript(sessionId);
        } catch {
          // Transcript fetch failed, will use fallback values
        }
      }
      
      // Get student name from profile or transcript
      const firstName = (personalDetails?.firstName as string) || '';
      const lastName = (personalDetails?.lastName as string) || '';
      let studentName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName);
      if (!studentName) {
        if (transcriptData?.student_name) {
          studentName = transcriptData.student_name;
        } else {
          // Try to get from results summary
          try {
            const results = await domainDiscoveryApi.getResultsSummary(sessionId);
            studentName = results.student_name || 'Student';
          } catch {
            studentName = 'Student';
          }
        }
      }
      
      // Build location string from profile
      const buildLocation = () => {
        const city = (personalDetails?.city as string) || '';
        const state = (personalDetails?.state as string) || '';
        const country = (personalDetails?.country as string) || '';
        const parts = [city, state, country].filter(Boolean);
        return parts.join(', ') || undefined;
      };

      const resultsData: DomainResultsData = {
        studentName,
        sessionId,
        startedAt: transcriptData?.started_at,
        completedAt: transcriptData?.completed_at || new Date().toISOString(),
        dateOfBirth: (personalDetails?.dob as string) || undefined,
        academicLevel: (educationalDetails?.academicLevel as string) || undefined,
        gradeLevel: (educationalDetails?.gradeLevel as string) || undefined,
        location: buildLocation(),
        interestScores: interestScores || {
          realistic: 0,
          investigative: 0,
          artistic: 0,
          social: 0,
          enterprising: 0,
          conventional: 0,
        },
        interests,
        strengths,
        recommendations,
      };
      
      // Generate PDF on the frontend
      const pdfBlob = generateDomainResultsPDF(resultsData);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Domain_Discovery_Results_${studentName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
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
      <div className="flex h-full items-center justify-center bg-linear-to-br from-teal-50 to-cyan-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-teal-600"></div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Analyzing Your Responses
          </h2>
          <p className="text-gray-600">
            Generating personalized domain recommendations based on your
            conversation…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-linear-to-br from-teal-50 to-cyan-100">
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
              className="bg-teal-600 hover:bg-teal-700"
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
    <div className="min-h-full bg-linear-to-br from-teal-50 to-cyan-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Heading level={1} className="mb-4 text-4xl font-bold text-gray-900">
            🧭 Your Domain Recommendations
          </Heading>
          <Paragraph className="mx-auto max-w-3xl text-xl text-gray-600">
            Based on your interests and curiosities, here are domains aligned to
            your passions and learning style.
          </Paragraph>
        </div>

        {/* Tabs */}
        <div className="mx-auto mb-8 max-w-5xl">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'results'
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Domain Results
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'border-b-2 border-teal-600 text-teal-600'
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
            {/* Interest Profile Chart - DISABLED (RIASEC removed) */}
            {/* The interest profile section has been disabled as RIASEC analysis is no longer included. */}

            {/* Interests & Strengths */}
            {(interests.length > 0 || strengths.length > 0) && (
              <div className="mx-auto mb-8 max-w-4xl rounded-lg bg-white p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                  <Heading level={3} className="text-lg font-semibold text-gray-900">
                    Results Summary
                  </Heading>
                  <Button
                    onClick={downloadResultsFile}
                    disabled={isDownloadingResults}
                    className="bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                  >
                    {isDownloadingResults ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        📄 Download Results
                      </>
                    )}
                  </Button>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {interests.length > 0 && (
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        💡 Your Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {interests.map((interest, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-teal-100 px-4 py-1 text-sm text-teal-700"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {strengths.length > 0 && (
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        💪 Your Strengths
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {strengths.map((strength, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-cyan-100 px-4 py-1 text-sm text-cyan-700"
                          >
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="mx-auto mb-8 max-w-4xl rounded-lg bg-white py-6 shadow-lg">
              <div className="grid text-center">
                <div>
                  <div className="text-3xl font-bold text-teal-600">
                    {recommendations.length}
                  </div>
                  <div className="text-sm text-gray-600">Domain Matches</div>
                </div>
              </div>
            </div>

            {/* Recommendation Cards */}
            <div className="mx-auto max-w-4xl space-y-6">
              {recommendations.map((domain, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-lg bg-white shadow-lg"
                >
                  {/* Header */}
                  <div className="bg-linear-to-r from-teal-600 to-cyan-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
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
                          <p className="text-teal-100 opacity-90">
                            <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColor(domain.category)}`}>
                              {domain.category}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          domain.match_percentage >= 90
                            ? 'bg-green-100 text-green-600'
                            : domain.match_percentage >= 80
                              ? 'bg-blue-100 text-blue-600'
                              : domain.match_percentage >= 70
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {domain.match_percentage}% Match
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h4 className="mb-3 text-lg font-semibold text-gray-900">
                          Domain Overview
                        </h4>
                        <p className="mb-4 leading-relaxed text-gray-600">
                          {domain.description}
                        </p>

                        <h4 className="mb-3 text-lg font-semibold text-gray-900">
                          Why This Domain Fits You
                        </h4>
                        <p className="mb-4 leading-relaxed text-gray-600">
                          {domain.why_recommended}
                        </p>

                        <h4 className="mb-3 text-lg font-semibold text-gray-900">
                          Your Key Interests
                        </h4>
                        <div className="mb-4 flex flex-wrap gap-2">
                          {domain.key_interests && domain.key_interests.length > 0 ? (
                            domain.key_interests.map((interest, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700"
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

                        <h4 className="mb-3 text-lg font-semibold text-gray-900">
                          Related School Subjects
                        </h4>
                        <div className="mb-4 flex flex-wrap gap-2">
                          {domain.related_subjects && domain.related_subjects.length > 0 ? (
                            domain.related_subjects.map((subject, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-700"
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

                      <div>
                        <h4 className="mb-3 text-lg font-semibold text-gray-900">
                          Sub-Domains to Explore
                        </h4>
                        {domain.sub_domains && domain.sub_domains.length > 0 ? (
                          <ul className="mb-6 space-y-2">
                            {domain.sub_domains.map((subDomain, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <svg
                                  className="mt-0.5 h-5 w-5 shrink-0 text-teal-500"
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
                                <span className="text-gray-600">{subDomain}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mb-6 text-sm text-gray-500 italic">
                            No specific sub-domains identified for this domain
                          </p>
                        )}

                        <h4 className="mb-3 text-lg font-semibold text-gray-900">
                          Exploration Activities
                        </h4>
                        {domain.exploration_activities && domain.exploration_activities.length > 0 ? (
                          <ul className="mb-6 space-y-2">
                            {domain.exploration_activities.map((activity, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
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
                                <span className="text-gray-600">{activity}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mb-6 text-sm text-gray-500 italic">
                            No specific exploration activities identified for this domain
                          </p>
                        )}

                        <h4 className="mb-3 text-lg font-semibold text-gray-900">
                          Potential Career Paths
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {domain.potential_careers && domain.potential_careers.length > 0 ? (
                            domain.potential_careers.map((career, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700"
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
              ))}
            </div>
          </>
        ) : (
          /* Conversation History Tab */
          <div className="mx-auto max-w-4xl">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
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
                    className="bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
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
                    <div key={message.question_number} className="border-l-4 border-teal-500 bg-gray-50 p-4">
                      <div className="mb-4">
                        <div className="mb-2 flex items-center">
                          <span className="inline-block rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">
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
            className="bg-linear-to-r from-purple-600 to-blue-600 font-semibold hover:from-purple-700 hover:to-blue-700"
          >
            <Link href="/career-discovery">🚀 Start Career Discovery</Link>
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
    </div>
  );
};

export default DomainResultsPage;
