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
  // Degree preference (only shown for non-high-school students)
  const [degreePreference, setDegreePreference] = useState<'career_only' | 'career_and_postgrad'>('career_only');

  // Domain selection state
  const [allDomains, setAllDomains] = useState<DomainItem[]>([]);
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(
    null
  );
  const [isLoadingDomains, setIsLoadingDomains] = useState(true);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
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

  // Detect student's academic level from profile to conditionally show degree preference
  const academicLevel: string = (
    (profileData as any)?.educational?.academicLevel ||
    (profileData as any)?.profile_data?.educational?.academicLevel ||
    ''
  );
  const isHighSchool = academicLevel === 'High School (8th\u201312th grade)';

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const loadDomains = async () => {
      try {
        setIsLoadingDomains(true);
        const response = await careerDiscoveryApi.getDomains();
        const domains = response.domains || [];
        domains.sort((a, b) => a.name.localeCompare(b.name));
        setAllDomains(domains);
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
        latestDomainSession?.session_id,
        isHighSchool ? undefined : degreePreference,
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

  const DOMAIN_DESCRIPTIONS: Record<string, string> = {
    'Social Sciences':
      'Explore human behavior, relationships, and society through fields like Psychology, Sociology, Political Science, and Economics. This domain helps individuals understand people, cultures, decision-making, and social systems.',
    'Health & Life Science':
      'Study living organisms, health, medicine, and biological processes through subjects such as Biology, Neuroscience, Biotechnology, and Public Health. Ideal for individuals interested in improving human health and understanding life sciences.',
    'Public Policy, Governance & Impact':
      'Focus on solving societal challenges through policy-making, governance, development, and social impact initiatives. Individuals learn how institutions, governments, and organizations create change at local and global levels.',
    'Statistics / Finance / Data Analytics':
      'Gather insights through quantitative analysis, data interpretation, and other data driven tools to use in financial decision-making, and problem-solving. This domain combines mathematics, technology, and business insights to drive evidence-based decisions.',
    'Humanities':
      'Examine human culture, history, language, philosophy, and ideas that shape societies. Individuals build critical thinking, communication, and analytical skills while exploring diverse perspectives.',
    'Art & Aesthetics':
      'Explore creativity, design, visual arts, and artistic expression across various mediums. This domain nurtures imagination, innovation, and an appreciation for beauty and culture.',
    'Business / Entrepreneurship':
      'Learn how organizations operate, create value, and solve market challenges. Individuals develop leadership, innovation, management, and entrepreneurial skills to build businesses or drive organizational success.',
    'Engineering & Applied Technology':
      'Apply scientific and technical principles to design solutions for real-world problems. This field includes areas such as computer science, all forms of engineering, robotics, and emerging technologies.',
    'Law':
      'Study legal systems, rights, justice, and the frameworks that govern society. Individuals develop strong reasoning, argumentation, and analytical skills while understanding legal processes and policy.',
    'Performing Arts':
      'Express creativity through disciplines such as music, theatre, dance, and performance. This domain develops artistic talent, communication, collaboration, and confidence.',
    'Pure Science':
      'Investigate the fundamental principles of the natural world through subjects like Physics, Chemistry, Mathematics, and Astronomy. Focuses on discovery, research, and advancing scientific knowledge.',
    'Sports/Athletics':
      'Combine physical performance, discipline, and teamwork through competitive sports and athletic pursuits. Individuals develop resilience, leadership, fitness, and sports-related expertise.',
  };

  // Split domains into recommended vs other
  const recommendedDomains = allDomains
    .filter((d) => isRecommended(d.name))
    .sort((a, b) => (getDomainMatchPct(b.name) ?? 0) - (getDomainMatchPct(a.name) ?? 0));
  const otherDomains = allDomains
    .filter((d) => !isRecommended(d.name))
    .sort((a, b) => a.name.localeCompare(b.name));
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
        onMouseEnter={() => setHoveredDomain(domain.name)}
        onMouseLeave={() => setHoveredDomain(null)}
        onFocus={() => setHoveredDomain(domain.name)}
        onBlur={() => setHoveredDomain(null)}
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
        {hoveredDomain === domain.name && DOMAIN_DESCRIPTIONS[domain.name] && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 z-50 w-80 p-4 rounded-2xl bg-gradient-to-b from-white to-sky-50/95 border border-sky-200 shadow-xl pointer-events-none animate-in fade-in-0 zoom-in-95 duration-200 text-left">
            <h4 className="text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <span className="text-base leading-none">{icon}</span>
              {domain.name}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">{DOMAIN_DESCRIPTIONS[domain.name]}</p>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1.5 w-3 h-3 bg-sky-50/95 border-r border-b border-sky-200 rotate-45"></div>
          </div>
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

        {/* Degree Preference — only for non-high-school students */}
        {!profileLoading && !isHighSchool && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/60 p-5">
            <h2 className="mb-1 text-base font-semibold text-slate-900">What would you like in your career report?</h2>
            <p className="mb-4 text-sm text-slate-500">Choose what your report should include. You can always start a new session to switch.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Option 1 */}
              <label
                className={`flex flex-1 cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all ${
                  degreePreference === 'career_only'
                    ? 'border-blue-500 bg-white shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="degreePreference"
                  value="career_only"
                  checked={degreePreference === 'career_only'}
                  onChange={() => setDegreePreference('career_only')}
                  className="mt-1 accent-blue-600"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">I only want a career report</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">Default</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">Get 5 career options with areas for growth, feasibility, and next steps — without postgrad degree suggestions.</p>
                </div>
              </label>
              {/* Option 2 */}
              <label
                className={`flex flex-1 cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all ${
                  degreePreference === 'career_and_postgrad'
                    ? 'border-indigo-500 bg-white shadow-md'
                    : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}
              >
                <input
                  type="radio"
                  name="degreePreference"
                  value="career_and_postgrad"
                  checked={degreePreference === 'career_and_postgrad'}
                  onChange={() => setDegreePreference('career_and_postgrad')}
                  className="mt-1 accent-indigo-600"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-800">I want a career report &amp; post grad degree options</span>
                  <p className="mt-0.5 text-xs text-slate-500">Get 5 career options AND postgraduate degree recommendations (Masters, MBA, etc.) alongside each career.</p>
                </div>
              </label>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-3xl border border-white bg-white p-6 shadow-xs">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-800">
              {sessions.length > 0
                ? 'Start a New Session'
                : 'Go Through Instructions Before We Start'}
            </h2>
            <p className="text-sm text-slate-500">
              Discover your ideal career path that bridges your interests, skills and future goals
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

        <div className="mb-6 rounded-lg border border-purple-100 bg-slate-50/50 p-6">
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
                I acknowledge that the report & recommendations are AI-generated; the results are dependent on my inputs..
              </span>
            </label>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartCareerDiscovery}
            disabled={isLoading || !hasReadInstructions || !domainsSelected}
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
        </div>
      </div>
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
