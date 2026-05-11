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
  } = useProfile();

  const testScores = (() => {
    const edu = educationalDetails as Record<string, unknown> | undefined;
    if (!edu) return [];
    // testScores may be at the top level or nested inside a section (highSchool, undergraduate, postgraduate, tenPlus)
    if (Array.isArray(edu.testScores) && edu.testScores.length > 0) return edu.testScores as Array<Record<string, string | number | undefined>>;
    for (const key of ['highSchool', 'undergraduate', 'postgraduate', 'tenPlus']) {
      const section = edu[key];
      if (section && typeof section === 'object' && !Array.isArray(section)) {
        const nested = (section as Record<string, unknown>).testScores;
        if (Array.isArray(nested) && nested.length > 0) return nested as Array<Record<string, string | number | undefined>>;
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
          sessionsCache.data !== null && now - sessionsCache.timestamp < CACHE_TTL;

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
    return () => { isCancelled = true; };
  }, []);

  const handleStartCollegeSelector = async () => {
    if (!hasReadInstructions) {
      setError('Please read all instructions before proceeding');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (!isProfileComplete) {
        setError('Please complete your profile before starting a session.');
        return;
      }

      if (testScores.length === 0) {
        setError('Please add your standardized test scores before starting a session.');
        return;
      }

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
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getSessionStatus = (session: SessionListItem) => {
    if (session.is_completed) return { label: 'Completed', color: 'bg-green-100 text-green-800' };
    if (session.preferences_completed) return { label: 'In Conversation', color: 'bg-blue-100 text-blue-800' };
    return { label: 'Filling Preferences', color: 'bg-yellow-100 text-yellow-800' };
  };

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="mx-auto px-1">
        {/* Hero Section */}
        <div className="mb-5 flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex-1">
            <Heading level={1} variant="web" className="font-extrabold text-neutral-900">
              Ready to find your
              <br />
              ideal colleges?
            </Heading>
            <p className="mt-3 text-sm text-gray-600">
              Please update your profile with your latest information before we begin.
            </p>
          </div>
          <div className="w-full shrink-0 md:w-auto">
            <BrainWithoutBGLottie loop={true} className="h-[200px] w-full max-w-[345px]" />
          </div>
        </div>

        {/* Previous Sessions */}
        {!isLoadingSessions && sessions.length > 0 && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50">
            <Accordion type="single" collapsible>
              <AccordionItem value="previous-sessions" className="border-b-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-900">Your Previous Sessions</span>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-sm text-gray-500">
                      {sessions.length} session{sessions.length !== 1 ? 's' : ''}
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
                              <span className={`rounded-full px-2 py-1 text-xs font-medium ${status.color}`}>
                                {status.label}
                              </span>
                              <span className="text-sm text-gray-500">{formatDate(session.created_at)}</span>
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                              Progress: {session.current_step} questions answered
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!session.is_completed ? (
                              <Button
                                variant="outline" size="sm"
                                onClick={() => handleResumeSession(session.session_id, session)}
                                className="border-green-500 text-green-600 hover:bg-green-50"
                              >
                                Resume
                              </Button>
                            ) : (
                              <Button
                                variant="outline" size="sm"
                                onClick={() => handleViewResults(session.session_id)}
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
        <div className="mb-6 rounded-lg border border-green-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              {sessions.length > 0 ? 'Start a New Session' : 'Go Through Instructions Before We Start'}
            </h2>
          </div>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">1</span>
              <span>This module helps you identify and shortlist the most suitable colleges based on your academic profile, goals, preferences, and financial capacity.</span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">2</span>
              <span>You'll first fill out a quick questionnaire about your degree goals, country preferences, campus setting, and other key criteria.</span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">3</span>
              <span>After the questionnaire, you can ask Ivy (via text or voice) any questions about college selection — tuition, visa policies, scholarships, and more.</span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">4</span>
              <span>Ivy will then generate a personalized list of 20 colleges across your selected countries, categorized as Reach, Match, or Safe.</span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">5</span>
              <span>Each college comes with detailed information: tuition fees, scholarships, rankings, visa policies, campus type, and more.</span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">6</span>
              <span>Make sure your profile — especially standardized test scores — is up to date for the most accurate recommendations.</span>
            </li>
          </ol>

          {error && (
            <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {!profileLoading && !isProfileComplete ? (
            <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-start gap-3">
                <FiIcon name="exclamation-circle" className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-800">Profile incomplete ({completionPercentage}%)</p>
                  <p className="mt-1 text-sm text-orange-700">
                    You need to complete your profile before starting College Selector.
                    {missingSections.some((s: string) => s === 'personalDetails' || s === 'educational') && (
                      <>
                        {' '}Missing:{' '}
                        {missingSections.map((s: string, i: number) => {
                          const slugMap: Record<string, string> = { personalDetails: 'personal', educational: 'educational', extraCurricular: 'extra-curricular' };
                          const labelMap: Record<string, string> = { personalDetails: 'Personal Details', educational: 'Educational', extraCurricular: 'Extra Curricular' };
                          return (
                            <span key={s}>
                              {i > 0 && ', '}
                              <Link href={`/profile/${slugMap[s] ?? s}/edit`} className="font-medium underline underline-offset-2 hover:text-orange-900">
                                {labelMap[s] ?? s.charAt(0).toUpperCase() + s.slice(1)}
                              </Link>
                            </span>
                          );
                        })}
                        .
                      </>
                    )}
                  </p>
                  <Link href="/profile/personal/edit" className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
                    <FiIcon name="pencil" className="h-4 w-4" />
                    Complete my profile
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Standardized Test Scores */}
              {!profileLoading && (
                <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <h3 className="mb-3 text-base font-semibold text-gray-900">Standardized Test Scores</h3>
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
                              <span className="text-xs text-gray-500">{score.testDate}</span>
                            )}
                          </div>
                          {(score.totalScore || score.yourScore) && (
                            <p className="text-2xl font-bold text-green-600">
                              {score.totalScore || score.yourScore}
                            </p>
                          )}
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            {score.mathYourScore && <p>Math: {score.mathYourScore}</p>}
                            {score.writingYourScore && <p>Writing: {score.writingYourScore}</p>}
                            {score.criticalReadingYourScore && <p>Reading: {score.criticalReadingYourScore}</p>}
                            {score.verbalReasoningScore && <p>Verbal: {score.verbalReasoningScore}</p>}
                            {score.quantitativeReasoningScore && <p>Quant: {score.quantitativeReasoningScore}</p>}
                            {score.analyticalWritingScore && <p>AWA: {score.analyticalWritingScore}</p>}
                            {score.englishYourScore && <p>English: {score.englishYourScore}</p>}
                            {score.scienceYourScore && <p>Science: {score.scienceYourScore}</p>}
                            {score.readingYourScore && <p>Reading: {score.readingYourScore}</p>}
                            {score.integratedReasoningScore && <p>IR: {score.integratedReasoningScore}</p>}
                            {score.dataInsightsScore && <p>Data Insights: {score.dataInsightsScore}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <p className="text-sm text-yellow-800">
                        You haven&apos;t added any standardized test scores yet. Test scores are required to start a college selection session.
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
                    onCheckedChange={(checked) => setHasReadInstructions(Boolean(checked))}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">I have read all the instructions mentioned above.</span>
                </label>
              </div>
              <Button
                variant="primary" size="lg"
                onClick={handleStartCollegeSelector}
                disabled={isLoading || !hasReadInstructions || profileLoading || testScores.length === 0}
                iconRight={<FiIcon name="arrow-small-right" className="h-5 w-5" />}
                className="mt-6"
              >
                {isLoading ? 'Starting...' : 'Start College Selection'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CollegeSelectorPageWrapper() {
  return (
    <ModuleAccessGuard moduleName="college_selector" moduleDisplay="College Selector">
      <CollegeSelectorPage />
    </ModuleAccessGuard>
  );
}
