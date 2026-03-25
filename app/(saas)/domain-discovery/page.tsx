'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { domainDiscoveryApi, SessionListItem } from '@/lib/domain-discovery-api';
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

interface DomainDiscoveryPageProps {}

// Module-level cache to prevent duplicate API calls in Strict Mode
let sessionsCache: { data: SessionListItem[] | null; promise: Promise<SessionListItem[]> | null; timestamp: number } = {
  data: null,
  promise: null,
  timestamp: 0,
};

// Cache expires after 30 seconds to ensure fresh data on real navigation
const CACHE_TTL = 30000;

export default function DomainDiscoveryPage({}: DomainDiscoveryPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const { isProfileComplete, completionPercentage, missingSections, loading: profileLoading } = useProfile();



  useEffect(() => {
    let isCancelled = false;
    
    const loadSessions = async () => {
      try {
        setIsLoadingSessions(true);
        
        const now = Date.now();
        const isCacheValid = sessionsCache.data !== null && (now - sessionsCache.timestamp) < CACHE_TTL;
        
        // Use cached data if available and not expired
        if (isCacheValid) {
          setSessions(sessionsCache.data!);
          setIsLoadingSessions(false);
          return;
        }
        
        // Reuse in-flight request if one exists
        if (!sessionsCache.promise) {
          sessionsCache.promise = domainDiscoveryApi.listSessions().then(res => {
            sessionsCache.data = res.sessions;
            sessionsCache.promise = null;
            sessionsCache.timestamp = Date.now();
            return res.sessions;
          }).catch(err => {
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
      if (!isProfileComplete) {
        setError('Please complete your profile before starting a session.');
        return;
      }

      const session = await domainDiscoveryApi.createSession();
      console.log('Created new session:', session);

      // Clear cache so session list is refreshed on return
      sessionsCache = { data: null, promise: null, timestamp: 0 };

      // Navigate to conversation page with session ID
      router.push(`/domain-discovery/${session.session_id}/conversations`);
    } catch (err) {
      console.error('Failed to start domain discovery:', err);
      setError('Failed to start domain discovery. Please try again.');
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
        <div className="mb-10 flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Left Content */}
          <div className="flex-1">
            <span className="mb-2 bg-linear-to-r from-teal-500 via-emerald-500 to-blue-400 bg-clip-text text-2xl font-semibold text-transparent md:text-2xl">
              Domain Discovery
            </span>
            <Heading
              level={1}
              variant="web"
              className="font-extrabold text-neutral-900"
            >
              Ready to discover
              <br />
              your interests?
            </Heading>
          </div>

          {/* Right - Brain Animation */}
          <div className="w-full shrink-0 md:w-auto">
            <BrainWithoutBGLottie loop={true} className="h-[200px] w-full max-w-[345px]" />
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
                              Progress: {session.current_step}{' '}
                              questions answered
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
                                onClick={() => handleResumeSession(session.session_id)}
                                className="border-teal-500 text-teal-600 hover:bg-teal-50"
                              >
                                Resume
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
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
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent"></div>
            <span className="ml-2 text-gray-500">Loading sessions...</span>
          </div>
        )}

        {/* Instructions Box */}
        <div className="mb-6 rounded-lg border border-teal-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              {sessions.length > 0
                ? 'Start a New Session'
                : 'Go Through Instructions Before We Start The Module'}
            </h2>
          </div>

          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">1</span>
              <span>
                This module helps you discover academic and interest domains that
                match your natural curiosities, passions, and learning preferences.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">2</span>
              <span>
                We analyze your existing profile data, interests, and activities
                to provide tailored domain recommendations.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">3</span>
              <span>
                You'll go through a 20-step guided conversation to uncover your
                interests and map them to potential domains.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">4</span>
              <span>
                Receive detailed domain matches with related subjects, exploration
                activities, and potential career paths to pursue.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">5</span>
              <span>
                The entire process takes about 30-40 minutes and is completely
                personalized to your background and interests.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">6</span>
              <span>
                Domain Discovery is a prerequisite for Career & Degree Selection- understanding
                your domains helps identify specific career paths later.
              </span>
            </li>
          </ol>

          {error && (
            <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!profileLoading && !isProfileComplete ? (
            <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-start gap-3">
                <FiIcon name="exclamation-circle" className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-800">Profile incomplete ({completionPercentage}%)</p>
                  <p className="mt-1 text-sm text-orange-700">
                    You need to complete your profile before starting a domain discovery session.
                    {missingSections.length > 0 && (
                      <> Missing: {missingSections.map((s, i) => {
                        const slugMap: Record<string, string> = {
                          personalDetails: 'personal',
                          educational: 'educational',
                          extraCurricular: 'extra-curricular',
                        };
                        const labelMap: Record<string, string> = {
                          personalDetails: 'Personal Details',
                          educational: 'Educational',
                          extraCurricular: 'Extra Curricular',
                        };
                        const slug = slugMap[s] ?? s;
                        const label = labelMap[s] ?? s.charAt(0).toUpperCase() + s.slice(1);
                        return (
                          <span key={s}>
                            {i > 0 && ', '}
                            <Link
                              href={`/profile/${slug}/edit`}
                              className="font-medium underline underline-offset-2 hover:text-orange-900"
                            >
                              {label}
                            </Link>
                          </span>
                        );
                      })}
                      .
                    </>)}
                  </p>
                  <Link
                    href="/profile/personal/edit"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                  >
                    <FiIcon name="pencil" className="h-4 w-4" />
                    Complete my profile
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                onClick={handleStartDomainDiscovery}
                disabled={isLoading || !hasReadInstructions || profileLoading}
                iconRight={<FiIcon name="arrow-small-right" className="h-5 w-5" />}
                className="mt-6"
              >
                {isLoading
                  ? 'Starting...'
                  : sessions.length > 0
                    ? 'Start New Session'
                    : 'Start Session'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
