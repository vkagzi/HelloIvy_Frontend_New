'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  careerDiscoveryApi,
  SessionListItem,
  DomainItem,
} from '@/lib/career-discovery-api';
import {
  domainDiscoveryApi,
  SessionListItem as DomainSessionListItem,
  DomainRecommendation,
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
import ReviewModal from '@/app/_components/ReviewModal';

interface CareerDiscoveryPageProps {}

function CareerDiscoveryPage({}: CareerDiscoveryPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [hasDomainSessions, setHasDomainSessions] = useState<boolean>(false);
  const [latestDomainSession, setLatestDomainSession] =
    useState<DomainSessionListItem | null>(null);
  const [domainRecommendations, setDomainRecommendations] = useState<
    DomainRecommendation[]
  >([]);
  const [isCheckingDomain, setIsCheckingDomain] = useState(true);
  const hasFetchedRef = useRef(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Domain selection state
  const [allDomains, setAllDomains] = useState<DomainItem[]>([]);
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(
    null
  );
  const [isLoadingDomains, setIsLoadingDomains] = useState(true);
  const {
    isProfileComplete,
    completionPercentage,
    missingSections,
    loading: profileLoading,
  } = useProfile();

  const handleCloseReview = () => {
    localStorage.setItem('stream_review_shown', 'true');

    setShowReviewModal(false);
  };

  useEffect(() => {
    const reviewShown = localStorage.getItem('stream_review_shown');

    if (!reviewShown) {
      setShowReviewModal(true);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const loadDomains = async () => {
      try {
        setIsLoadingDomains(true);
        const response = await careerDiscoveryApi.getDomains();
        setAllDomains(response.domains || []);
      } catch (err) {
        console.error('Failed to load domains:', err);
      } finally {
        setIsLoadingDomains(false);
      }
    };

    const checkDomainDiscovery = async () => {
      try {
        setIsCheckingDomain(true);
        // Fetch only the last completed session (is_completed=true, limit=1)
        const response = await domainDiscoveryApi.listSessions(true, 1);
        setHasDomainSessions(response.total_count > 0);
        if (response.sessions.length > 0) {
          // Get the most recent completed session
          const latestSession = response.sessions[0];
          setLatestDomainSession(latestSession);

          // Fetch recommendations for the latest session
          try {
            const recsResponse = await domainDiscoveryApi.getRecommendations(
              latestSession.session_id
            );
            const recs = recsResponse.recommendations || [];
            setDomainRecommendations(recs);

            // Pre-select top 2 recommendations
            if (recs.length >= 2) {
              setSelectedPrimary(recs[0].domain_title);
              setSelectedSecondary(recs[1].domain_title);
            } else if (recs.length === 1) {
              setSelectedPrimary(recs[0].domain_title);
            }
          } catch (err) {
            console.error('Failed to fetch domain recommendations:', err);
            setDomainRecommendations([]);
          }
        }
      } catch (err) {
        console.error(
          'Failed to check Stream & Subject Selection sessions:',
          err
        );
        setHasDomainSessions(false);
        setLatestDomainSession(null);
        setDomainRecommendations([]);
      } finally {
        setIsCheckingDomain(false);
      }
    };

    const loadSessions = async () => {
      try {
        setIsLoadingSessions(true);
        const response = await careerDiscoveryApi.listSessions();
        setSessions(response.sessions);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    loadDomains();
    checkDomainDiscovery();
    loadSessions();
  }, []);

  const handleDomainClick = (domainName: string) => {
    if (selectedPrimary === domainName) {
      // Deselect primary — promote secondary if exists
      setSelectedPrimary(selectedSecondary);
      setSelectedSecondary(null);
    } else if (selectedSecondary === domainName) {
      // Deselect secondary
      setSelectedSecondary(null);
    } else if (!selectedPrimary) {
      setSelectedPrimary(domainName);
    } else if (!selectedSecondary) {
      setSelectedSecondary(domainName);
    } else {
      // Both already selected — replace secondary
      setSelectedSecondary(domainName);
    }
  };

  const domainsSelected = selectedPrimary !== null;

  const handleStartCareerDiscovery = async () => {
    if (!hasReadInstructions) {
      setError('Please read all instructions before proceeding');
      return;
    }

    if (!isProfileComplete) {
      setError('Please complete your profile before starting a session.');
      return;
    }

    if (!selectedPrimary) {
      setError('Please select at least your primary domain before starting.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Clear any stored session to force a new one
      try {
        localStorage.removeItem('career_session_id');
        sessionStorage.removeItem('career_session_active');
      } catch {
        // ignore
      }

      // Create a new session with selected domains and optional domain session ID
      const session = await careerDiscoveryApi.createSession(
        selectedPrimary,
        selectedSecondary ?? undefined,
        latestDomainSession?.session_id
      );
      console.log('Created new session:', session);

      // Navigate to conversation page with session ID
      router.push(`/career-discovery/${session.session_id}/conversations`);
    } catch (err: any) {
      console.error('Failed to start Career & Degree Selection :', err);
      setError(
        'Failed to start Career & Degree Selection . Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSession = async (sessionId: string) => {
    try {
      router.push(`/career-discovery/${sessionId}/conversations`);
    } catch (err) {
      console.error('Failed to resume session:', err);
      setError('Failed to resume session. Please try again.');
    }
  };

  const handleViewResults = (sessionId: string) => {
    router.push(`/career-discovery/${sessionId}/results`);
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

  const getDomainBadge = (domainName: string) => {
    if (selectedPrimary === domainName) return { num: '1', label: 'Primary' };
    if (selectedSecondary === domainName) return { num: '2', label: 'Secondary' };
    return null;
  };

  // Find domain recommendation match percentage (if available)
  const getDomainMatchPct = (domainName: string): number | null => {
    const rec = domainRecommendations.find(
      (r) => r.domain_title === domainName
    );
    return rec ? rec.match_percentage : null;
  };

  const isRecommended = (domainName: string): boolean =>
    domainRecommendations.some((r) => r.domain_title === domainName);

  const DOMAIN_ICONS: Record<string, string> = {
    'Pure Science': '🔬',
    'Performing Arts': '🎭',
    'Humanities': '📚',
    'Business / Entrepreneurship': '💼',
    'Statistics / Finance / Data Analytics': '📊',
    'Law': '⚖️',
    'Social Sciences': '🧠',
    'Health & Life Science': '🩺',
    'Sports/Athletics': '🏅',
    'Engineering & Applied Technology': '⚙️',
    'Art & Aesthetics': '🎨',
    'Public Policy, Governance & Impact': '🏛️',
  };

  // Split domains into recommended vs other
  const recommendedDomains = allDomains.filter((d) => isRecommended(d.name));
  const otherDomains = allDomains.filter((d) => !isRecommended(d.name));
  const hasRecommendations = recommendedDomains.length > 0;

  const renderDomainCard = (domain: DomainItem) => {
    const badge = getDomainBadge(domain.name);
    const matchPct = getDomainMatchPct(domain.name);
    const icon = DOMAIN_ICONS[domain.name] || '📌';
    return (
      <button
        key={domain.name}
        type="button"
        onClick={() => handleDomainClick(domain.name)}
        className={`relative flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-left transition-all ${
          badge?.num === '1'
            ? 'border-blue-500 bg-blue-50/50 shadow-md ring-1 ring-blue-200'
            : badge?.num === '2'
              ? 'border-teal-500 bg-teal-50/50 shadow-md ring-1 ring-teal-200'
              : 'border-gray-200 bg-white hover:border-slate-400 hover:shadow-sm'
        }`}
      >
        {badge && (
          <span
            className={`absolute -top-2.5 -right-2 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white shadow ${
              badge.num === '1' ? 'bg-blue-600' : 'bg-teal-600'
            }`}
          >
            {badge.num}
            <span className="font-medium">{badge.label}</span>
          </span>
        )}
        <span className="text-lg leading-none">{icon}</span>
        <span
          className={`text-sm font-semibold ${
            badge?.num === '1'
              ? 'text-blue-900'
              : badge?.num === '2'
                ? 'text-teal-900'
                : 'text-gray-800'
          }`}
        >
          {domain.name}
        </span>
        {matchPct !== null && (
          <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {matchPct}%
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="mx-auto px-1">
        {/* Hero Section */}
        <div className="mb-5 flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Left Content */}
          <div className="flex-1">
            <Heading
              level={1}
              variant="web"
              className="font-extrabold text-neutral-900"
            >
              Ready to start
              <br />
              Career & Degree Selection ?
            </Heading>
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
                              Progress: {session.current_step} questions •{' '}
                              {session.current_phase === 'profile'
                                ? 'Profile Builder'
                                : 'Career Explorer'}
                              {session.domain_session_id && (
                                <span className="ml-2 text-xs text-gray-500">
                                  (Based on Domain:{' '}
                                  {session.domain_session_id.substring(0, 8)}
                                  ...)
                                </span>
                              )}
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
                                className="border-purple-500 text-purple-600 hover:bg-purple-50"
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
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
            <span className="ml-2 text-gray-500">Loading sessions...</span>
          </div>
        )}

        {/* Domain Selection Section */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Select upto 2 domains to discover career options suited for you
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {hasDomainSessions && domainRecommendations.length > 0
                ? 'Based on your Stream & Subject Selection results, we\u2019ve pre-selected your top 2 domains. You can confirm or change your selections below.'
                : 'Choose 2 domains you\u2019d like to explore career options in. Click to select your primary (1st) and secondary (2nd) domain.'}
            </p>
          </div>

          {/* Selected domains summary */}
          {(selectedPrimary || selectedSecondary) && (
            <div className="mb-4 flex flex-wrap gap-3">
              {selectedPrimary && (
                <div className="flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600">
                    1
                  </span>
                  {selectedPrimary}
                  <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Primary
                  </span>
                </div>
              )}
              {selectedSecondary && (
                <div className="flex items-center gap-2 rounded-full bg-teal-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-teal-600">
                    2
                  </span>
                  {selectedSecondary}
                  <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Secondary
                  </span>
                </div>
              )}
            </div>
          )}

          {isLoadingDomains ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
              <span className="ml-2 text-gray-500">Loading domains...</span>
            </div>
          ) : hasRecommendations ? (
            <>
              {/* Recommended domains */}
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <FiIcon name="star" className="h-3 w-3" />
                Recommended for You
              </div>
              <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {recommendedDomains.map(renderDomainCard)}
              </div>
              {/* Other domains */}
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Other Domains
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {otherDomains.map(renderDomainCard)}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {allDomains.map(renderDomainCard)}
            </div>
          )}
        </div>

        {/* Instructions Box */}
        <div className="mb-6 rounded-lg border border-orange-200 p-6">
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
                This module helps you discover your ideal career path through
                personalized, AI-powered analysis based on your unique profile
                and experiences.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">2</span>
              <span>
                {latestDomainSession ? (
                  <>
                    Your career recommendations will be based on your Stream &
                    Subject Selection insights from{' '}
                    <strong>
                      {formatDate(latestDomainSession.created_at)}
                    </strong>
                    , combined with your profile data to provide highly
                    personalized suggestions.
                  </>
                ) : (
                  'We analyze your existing profile data, experiences, and achievements to provide tailored career recommendations.'
                )}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">3</span>
              <span>
                You&apos;ll go through an 18-step guided conversation to uncover
                your career preferences and interests.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">4</span>
              <span>
                Receive detailed career matches with next steps, and actionable
                insights to pursue your recommended career paths.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">5</span>
              <span>
                The entire process takes about 25-35 minutes and is completely
                personalized to your background.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">6</span>
              <span>
                Find a comfortable space where you can focus and be ready to
                share your career aspirations and preferences.
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
                <FiIcon
                  name="exclamation-circle"
                  className="mt-0.5 h-5 w-5 shrink-0 text-orange-500"
                />
                <div className="flex-1">
                  <p className="font-semibold text-orange-800">
                    Profile incomplete ({completionPercentage}%)
                  </p>
                  <p className="mt-1 text-sm text-orange-700">
                    You need to complete your profile before starting a Career &
                    Degree Selection session.
                    {missingSections.some(s => s === 'personalDetails' || s === 'educational') && (
                      <>
                        {' '}
                        Missing:{' '}
                        {missingSections.map((s, i) => {
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
                          const label =
                            labelMap[s] ??
                            s.charAt(0).toUpperCase() + s.slice(1);
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
                      </>
                    )}
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
                onClick={handleStartCareerDiscovery}
                disabled={isLoading || !hasReadInstructions || !domainsSelected || profileLoading}
                iconRight={<FiIcon name="arrow-small-right" className="h-5 w-5" />}
                className="mt-6"
              >
                {isLoading
                  ? 'Starting...'
                  : !domainsSelected
                    ? 'Select Your Domains First'
                    : sessions.length > 0
                      ? 'Start New Session'
                      : 'Start Session'}
              </Button>
            </>
          )}
        </div>
      </div>
      <ReviewModal open={showReviewModal} onClose={handleCloseReview} module="career"/>
    </div>
  );
}

export default function Page() {
  return (
    <ModuleAccessGuard
      moduleName="career_discovery"
      moduleDisplay="Career & Degree Selection"
    >
      <CareerDiscoveryPage />
    </ModuleAccessGuard>
  );
}
