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
    loading: profileLoading,
    profileData,
  } = useProfile();

  const profileExists = profileData !== null;
  const linkText = profileExists ? 'View/Edit your profile' : 'Create your profile';
  const linkHref = '/profile/personal';


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

      const session = await collegeSelectorApi.createSession();
      sessionsCache = { data: null, promise: null, timestamp: 0 };
      router.push(`/college-selector/${session.session_id}/preferences`);
    } catch (err: any) {
      console.error('Failed to start College Selector:', err);
      const body = err?.cause?.body;
      if (body?.missing_modules || body?.missing_sections) {
        setError(body.error || 'Please complete prerequisites before starting College Selector.');
      } else {
        setError(err?.message || 'Failed to start College Selector. Please try again.');
      }
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
            disabled={isLoading || !hasReadInstructions}
            iconRight={<FiIcon name="arrow-small-right" className="h-5 w-5" />}
            className="mt-6"
          >
            {isLoading ? 'Starting...' : 'Start College Selection'}
          </Button>
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
