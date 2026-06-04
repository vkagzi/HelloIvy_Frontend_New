'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  collegeSelectorApi,
  SessionListItem,
} from '@/lib/college-selector-api';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';
import { Checkbox } from '@/app/_components/Checkbox';
import { BrainWithoutBGLottie } from '@/app/_components/LottieAnimation';
import { Heading } from '@/app/_components/Typography';
import { Button } from '@/app/_components/Button';
import { FiIcon } from '@/app/_components/Icons';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import ModuleAccessGuard from '@/app/_components/ModuleAccessGuard';

let sessionsCache: {
  data: SessionListItem[] | null;
  promise: Promise<SessionListItem[]> | null;
  timestamp: number;
} = { data: null, promise: null, timestamp: 0 };

const CACHE_TTL = 30000;

const instructionItems = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 text-neutral-700"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    text: 'Ensure your profile is up to date',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 text-neutral-700"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    text: 'Fill out a quick questionnaire',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 text-neutral-700"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    text: 'Ask Ivy any additional questions',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 text-neutral-700"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
      </svg>
    ),
    text: 'Get a personalized list of colleges',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 text-neutral-700"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
    text: 'Explore colleges across Reach, Match, or Safe categories',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 text-neutral-700"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    text: 'Confidently shortlist!',
  },
];

function CollegeSelectorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const {
    isProfileComplete,
    completionPercentage,
    missingSections,
    educationalDetails,
    loading: profileLoading,
    profileData,
  } = useProfile();

  const profileExists = profileData !== null;
  const linkText = profileExists ? 'View/Edit your profile' : 'Create your profile';
  const linkHref = '/profile/personal';

  const testScores = (() => {
    const edu = educationalDetails as Record<string, unknown> | undefined;
    if (!edu) return [];
    // testScores may be at the top level or nested inside a section (highSchool, undergraduate, postgraduate, tenPlus)
    if (Array.isArray(edu.testScores) && edu.testScores.length > 0)
      return edu.testScores as Array<
        Record<string, string | number | undefined>
      >;
    for (const key of [
      'highSchool',
      'undergraduate',
      'postgraduate',
      'tenPlus',
    ]) {
      const section = edu[key];
      if (section && typeof section === 'object' && !Array.isArray(section)) {
        const nested = (section as Record<string, unknown>).testScores;
        if (Array.isArray(nested) && nested.length > 0)
          return nested as Array<Record<string, string | number | undefined>>;
      }
    }
    return [];
  })();

  useEffect(() => {
    let isCancelled = false;

    const loadSessions = async () => {
      try {
        setIsLoadingSessions(true);
        const now = Date.now();
        const isCacheValid =
          sessionsCache.data !== null &&
          now - sessionsCache.timestamp < CACHE_TTL;

        if (isCacheValid) {
          setSessions(sessionsCache.data!);
          setIsLoadingSessions(false);
          return;
        }

        if (!sessionsCache.promise) {
          sessionsCache.promise = collegeSelectorApi
            .listSessions()
            .then((res) => {
              sessionsCache.data = res.sessions;
              sessionsCache.promise = null;
              sessionsCache.timestamp = Date.now();
              return res.sessions;
            })
            .catch((err) => {
              sessionsCache.promise = null;
              throw err;
            });
        }

        const sessionsList = await sessionsCache.promise;
        if (!isCancelled) setSessions(sessionsList);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        if (!isCancelled) setIsLoadingSessions(false);
      }
    };

    loadSessions();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleStartCollegeSelector = async () => {
    if (!hasReadInstructions) {
      setError('Please read all instructions before proceeding');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Profile completion check removed to allow independent module access.

      const session = await collegeSelectorApi.createSession();
      sessionsCache = { data: null, promise: null, timestamp: 0 };
      router.push(`/college-selector/${session.session_id}/preferences`);
    } catch (err) {
      console.error('Failed to start College Selector:', err);
      setError('Failed to start College Selector. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSession = (sessionId: string, session: SessionListItem) => {
    if (!session.preferences_completed) {
      router.push(`/college-selector/${sessionId}/preferences`);
    } else {
      router.push(`/college-selector/${sessionId}/conversations`);
    }
  };

  const handleViewResults = (sessionId: string) => {
    router.push(`/college-selector/${sessionId}/results`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSessionStatus = (session: SessionListItem) => {
    if (session.is_completed)
      return { label: 'Completed', color: 'bg-green-100 text-green-800' };
    if (session.preferences_completed)
      return { label: 'In Conversation', color: 'bg-blue-100 text-blue-800' };
    return {
      label: 'Filling Preferences',
      color: 'bg-yellow-100 text-yellow-800',
    };
  };

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="mx-auto px-1">
        {/* Hero Section */}
        <div className="mb-5 flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex-1">
            <Heading
              level={1}
              variant="web"
              className="font-extrabold text-neutral-900"
            >
              Ready to find your
              <br />
              ideal colleges?
            </Heading>
            <p className="mt-3 text-sm text-gray-600">
              Please update your profile with your latest information before we
              begin.
            </p>
            {profileLoading ? (
              <div className="mt-5 h-10 w-44 animate-pulse rounded-xl bg-neutral-200" />
            ) : (
              <Link
                href={linkHref}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:scale-105 hover:from-cyan-600 hover:to-blue-600 hover:shadow-xl active:scale-95"
              >
                {linkText}
              </Link>
            )}
          </div>
          <div className="w-full shrink-0 md:w-auto">
            <BrainWithoutBGLottie
              loop={true}
              className="h-[200px] w-full max-w-[345px]"
            />
          </div>
        </div>

        {/* Previous Sessions */}
        {!isLoadingSessions && sessions.length > 0 && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50">
            <Accordion type="single" collapsible>
              <AccordionItem value="previous-sessions" className="border-b-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-900">
                      Your Previous Sessions
                    </span>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-sm text-gray-500">
                      {sessions.length} session
                      {sessions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6">
                  <div className="space-y-3">
                    {sessions.map((session) => {
                      const status = getSessionStatus(session);
                      return (
                        <div
                          key={session.session_id}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${status.color}`}
                              >
                                {status.label}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(session.created_at)}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                              Progress: {session.current_step} questions
                              answered
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!session.is_completed ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleResumeSession(
                                    session.session_id,
                                    session
                                  )
                                }
                                className="border-green-500 text-green-600 hover:bg-green-50"
                              >
                                Resume
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleViewResults(session.session_id)
                                }
                                className="border-green-500 text-green-600 hover:bg-green-50"
                              >
                                View Results
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {isLoadingSessions && (
          <div className="mb-8 flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent"></div>
            <span className="ml-2 text-gray-500">Loading sessions...</span>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-6 rounded-3xl border border-white bg-white p-6 shadow-xs">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-800">
              {sessions.length > 0
                ? 'Start a New Session'
                : 'Go Through Instructions Before We Start'}
            </h2>
            <p className="text-sm text-slate-500">
              Identify and shortlist the most suitable colleges based on your academic profile, goals, preferences, and financial capacity.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {instructionItems.map((item, index) => (
              <div
                key={index}
                className="relative p-[1px] bg-gradient-to-br from-cyan-200 to-blue-100 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xs"
              >
                <div className="flex h-full flex-col items-center rounded-[23px] bg-gradient-to-b from-white to-blue-50/30 p-5 text-center">
                  {/* Icon Wrapper */}
                  <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-neutral-100/80 text-neutral-800 shadow-xs">
                    {item.icon}
                  </div>

                  {/* Step Indicator & Text */}
                  <span className="mb-1 text-xs font-bold tracking-wider text-blue-600/90 uppercase">
                    Step 0{index + 1}
                  </span>
                  <p className="text-sm leading-snug font-semibold text-slate-700">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

          {error && (
            <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Profile and module completion gates removed. Content is now directly rendered. */}
          <>
            {/* Standardized Test Scores */}
              {!profileLoading && (
                <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <h3 className="mb-3 text-base font-semibold text-gray-900">
                    Standardized Test Scores
                  </h3>
                  {testScores.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {testScores.map((score, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-gray-100 bg-white p-4"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800">
                              {score.testType || 'Test'}
                            </span>
                            {score.testDate && (
                              <span className="text-xs text-gray-500">
                                {score.testDate}
                              </span>
                            )}
                          </div>
                          {(score.totalScore || score.yourScore) && (
                            <p className="text-2xl font-bold text-green-600">
                              {score.totalScore || score.yourScore}
                            </p>
                          )}
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            {score.mathYourScore && (
                              <p>Math: {score.mathYourScore}</p>
                            )}
                            {score.writingYourScore && (
                              <p>Writing: {score.writingYourScore}</p>
                            )}
                            {score.criticalReadingYourScore && (
                              <p>Reading: {score.criticalReadingYourScore}</p>
                            )}
                            {score.verbalReasoningScore && (
                              <p>Verbal: {score.verbalReasoningScore}</p>
                            )}
                            {score.quantitativeReasoningScore && (
                              <p>Quant: {score.quantitativeReasoningScore}</p>
                            )}
                            {score.analyticalWritingScore && (
                              <p>AWA: {score.analyticalWritingScore}</p>
                            )}
                            {score.englishYourScore && (
                              <p>English: {score.englishYourScore}</p>
                            )}
                            {score.scienceYourScore && (
                              <p>Science: {score.scienceYourScore}</p>
                            )}
                            {score.readingYourScore && (
                              <p>Reading: {score.readingYourScore}</p>
                            )}
                            {score.integratedReasoningScore && (
                              <p>IR: {score.integratedReasoningScore}</p>
                            )}
                            {score.dataInsightsScore && (
                              <p>Data Insights: {score.dataInsightsScore}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <p className="text-sm text-yellow-800">
                        You haven&apos;t added any standardized test scores yet.
                        You can add them to get more accurate college
                        recommendations.
                      </p>
                      <Link
                        href="/profile/educational/edit#standardised-test-score"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-green-700 underline underline-offset-2 hover:text-green-900"
                      >
                        <FiIcon name="pencil" className="h-4 w-4" />
                        Add your test scores
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox
                    checked={hasReadInstructions}
                    onCheckedChange={(checked) =>
                      setHasReadInstructions(Boolean(checked))
                    }
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    I have read all the instructions mentioned above.
                  </span>
                </label>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartCollegeSelector}
                disabled={
                  isLoading ||
                  !hasReadInstructions ||
                  profileLoading
                }
                iconRight={
                  <FiIcon name="arrow-small-right" className="h-5 w-5" />
                }
                className="mt-6"
              >
                {isLoading ? 'Starting...' : 'Start College Selection'}
              </Button>
          </>
      </div>
    </div>
  );
}

export default function CollegeSelectorPageWrapper() {
  return (
    <ModuleAccessGuard
      moduleName="college_selector"
      moduleDisplay="College Selector"
    >
      <CollegeSelectorPage />
    </ModuleAccessGuard>
  );
}
