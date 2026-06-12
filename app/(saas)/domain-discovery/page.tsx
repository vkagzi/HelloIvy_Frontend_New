'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  domainDiscoveryApi,
  SessionListItem,
} from '@/lib/domain-discovery-api';
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

interface DomainDiscoveryPageProps {}

// Module-level cache to prevent duplicate API calls in Strict Mode
let sessionsCache: {
  data: SessionListItem[] | null;
  promise: Promise<SessionListItem[]> | null;
  timestamp: number;
} = {
  data: null,
  promise: null,
  timestamp: 0,
};

// Cache expires after 30 seconds to ensure fresh data on real navigation
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
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    text: 'Set aside 30 minutes ',
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
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
    text: 'Speak clearly into the mic',
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
        <path d="M17 2H7v6l5 4-5 4v6h10v-6l-5-4 5-4V2z" />
        <path d="M9 17h6" />
        <path d="M10 6h4" />
      </svg>
    ),
    text: 'Wait for the green bar before you speak',
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
        <path d="M3 20a6 6 0 0 1 10.4-4" />
        <circle cx="8" cy="7" r="4" />
        <path d="M22 13.5a1.9 1.9 0 0 0-3.4-1.2 1.9 1.9 0 0 0-3.4 1.2c0 2 3.4 3.8 3.4 3.8s3.4-1.8 3.4-3.8z" />
      </svg>
    ),
    text: 'Answer naturally & truthfully',
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
        <rect x="3" y="3" width="5" height="5" rx="1" />
        <rect x="3" y="11" width="5" height="5" rx="1" />
        <rect x="3" y="19" width="5" height="5" rx="1" />
        <line x1="11" y1="5.5" x2="21" y2="5.5" />
        <line x1="11" y1="13.5" x2="21" y2="13.5" />
        <line x1="11" y1="21.5" x2="21" y2="21.5" />
        <polyline points="4.5 5.5 5.5 6.5 7 4.5" />
        <polyline points="4.5 13.5 5.5 14.5 7 12.5" />
      </svg>
    ),
    text: 'Choose one or more options for MCQs',
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
        <circle cx="11" cy="14" r="3" />
        <path d="M11 11v3h3" />
        <line x1="8" y1="19" x2="16" y2="19" />
      </svg>
    ),
    text: 'Download your report!',
  },
];

function DomainDiscoveryPage({}: DomainDiscoveryPageProps) {
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
  const linkHref = '/profile/personal/edit';

  useEffect(() => {
    let isCancelled = false;

    const loadSessions = async () => {
      try {
        setIsLoadingSessions(true);

        const now = Date.now();
        const isCacheValid =
          sessionsCache.data !== null &&
          now - sessionsCache.timestamp < CACHE_TTL;

        // Use cached data if available and not expired
        if (isCacheValid) {
          setSessions(sessionsCache.data!);
          setIsLoadingSessions(false);
          return;
        }

        // Reuse in-flight request if one exists
        if (!sessionsCache.promise) {
          sessionsCache.promise = domainDiscoveryApi
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
        if (!isCancelled) {
          setSessions(sessionsList);
        }
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingSessions(false);
        }
      }
    };

    loadSessions();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleStartDomainDiscovery = async () => {
    if (!hasReadInstructions) {
      setError('Please read all instructions before proceeding');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Clear any stored session to force a new one
      try {
        localStorage.removeItem('domain_session_id');
        sessionStorage.removeItem('domain_session_active');
      } catch {
        // ignore
      }

      // Create a new session
      const session = await domainDiscoveryApi.createSession();
      console.log('Created new session:', session);

      // Clear cache so session list is refreshed on return
      sessionsCache = { data: null, promise: null, timestamp: 0 };

      // Navigate to conversation page with session ID
      router.push(`/domain-discovery/${session.session_id}/conversations`);
    } catch (err) {
      console.error('Failed to start Stream & Subject Selection:', err);
      setError('Failed to start Stream & Subject Selection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSession = async (sessionId: string) => {
    try {
      router.push(`/domain-discovery/${sessionId}/conversations`);
    } catch (err) {
      console.error('Failed to resume session:', err);
      setError('Failed to resume session. Please try again.');
    }
  };

  const handleViewResults = (sessionId: string) => {
    router.push(`/domain-discovery/${sessionId}/results`);
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
    if (!session.is_completed) {
      return {
        label: 'In Progress',
        color: 'bg-yellow-100 text-yellow-800',
      };
    }
    return {
      label: 'Completed',
      color: 'bg-green-100 text-green-800',
    };
  };

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="mx-auto px-1">
        {/* Hero Section */}
        <div className="mb-5 flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Left Content */}
          <div className="flex-1">
            {/* <span className="mb-2 bg-linear-to-r from-teal-500 via-emerald-500 to-blue-400 bg-clip-text text-2xl font-semibold text-transparent md:text-2xl">
              Stream & Subject Selection
            </span> */}
            <Heading
              level={1}
              variant="web"
              className="font-extrabold text-neutral-900"
            >
              Ready to select your
              <br />
              streams and subjects?
            </Heading>
            <p className="mt-3 text-sm text-gray-600">
              Discover potential career paths and subjects that match you best
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
            <p className="mt-3 text-sm text-gray-600">
              Please update your profile with your latest information
            </p>
          </div>

          {/* Right - Brain Animation */}
          <div className="w-full shrink-0 md:w-auto">
            <BrainWithoutBGLottie
              loop={true}
              className="h-[200px] w-full max-w-[345px]"
            />
          </div>
        </div>

        {/* Previous Sessions Section */}
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
                              {/* {session.current_phase === 'riasec'
                                ? `Initial: ${session.riasec_completed}/${session.riasec_questions_count ?? 10}`
                                : `Deep Dive: ${session.deepdive_completed}/${session.deepdive_questions_count ?? 10}`} */}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!session.is_completed ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleResumeSession(session.session_id)
                                }
                                className="border-teal-500 text-teal-600 hover:bg-teal-50"
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
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent"></div>
            <span className="ml-2 text-gray-500">Loading sessions...</span>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-6 rounded-3xl border border-white bg-white p-6 shadow-xs">
          {/* <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-800">
              {sessions.length > 0
                ? 'Start a New Session'
                : 'Go Through Instructions Before We Start'}
            </h2>
            <p className="text-sm text-slate-500">
              Discover academic and interest domains that match your natural curiosities, passions, and learning preferences.
            </p>
          </div> */}

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

        <div className="mb-6 rounded-lg border border-teal-100 bg-slate-50/50 p-6">
          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={hasReadInstructions}
                onCheckedChange={(checked) =>
                  setHasReadInstructions(Boolean(checked))
                }
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                I acknowledge that the report & recommendations are AI-generated; the results are dependent on my inputs.
              </span>
            </label>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartDomainDiscovery}
            disabled={isLoading || !hasReadInstructions}
            iconRight={
              <FiIcon name="arrow-small-right" className="h-5 w-5" />
            }
            className="mt-6"
          >
            {isLoading
              ? 'Starting...'
              : sessions.length > 0
                ? 'Start New Session'
                : 'Start Session'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ModuleAccessGuard moduleName="domain_discovery" moduleDisplay="Stream & Subject Selection">
      <DomainDiscoveryPage />
    </ModuleAccessGuard>
  );
}
