'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { careerDiscoveryApi, SessionListItem } from '@/lib/career-discovery-api';
import { 
  domainDiscoveryApi, 
  SessionListItem as DomainSessionListItem,
  DomainRecommendation 
} from '@/lib/domain-discovery-api';
import { useOpenAITTS } from '@/app/_hooks/useOpenAITTS';
import { Checkbox } from '@/app/_components/Checkbox';
import { BrainWithoutBGLottie } from '@/app/_components/LottieAnimation';
import { Heading, Label, Paragraph } from '@/app/_components/Typography';
import { Button } from '@/app/_components/Button';
import { FiIcon } from '@/app/_components/Icons';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface CareerDiscoveryPageProps {}

export default function CareerDiscoveryPage({}: CareerDiscoveryPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [hasDomainSessions, setHasDomainSessions] = useState<boolean>(false);
  const [latestDomainSession, setLatestDomainSession] = useState<DomainSessionListItem | null>(null);
  const [domainRecommendations, setDomainRecommendations] = useState<DomainRecommendation[]>([]);
  const [isCheckingDomain, setIsCheckingDomain] = useState(true);
  const { speakText, isSpeaking } = useOpenAITTS();

  const instructions = `This module helps you discover your ideal career path through personalized, AI-powered analysis based on your unique profile and experiences. We analyze your existing profile data and guide you through 20 thoughtful questions about your preferences. You'll receive personalized career recommendations with detailed insights, salary ranges, and specific next steps. The process takes about 30-40 minutes and is completely personalized to your background.`;

  useEffect(() => {
    checkDomainDiscovery();
    loadSessions();
  }, []);

  const checkDomainDiscovery = async () => {
    try {
      setIsCheckingDomain(true);
      const response = await domainDiscoveryApi.listSessions();
      setHasDomainSessions(response.sessions.length > 0);
      if (response.sessions.length > 0) {
        // Get the most recent session (sessions are already ordered by -created_at)
        const latestSession = response.sessions[0];
        setLatestDomainSession(latestSession);
        
        // Fetch recommendations for the latest session
        try {
          const recsResponse = await domainDiscoveryApi.getRecommendations(latestSession.session_id);
          setDomainRecommendations(recsResponse.recommendations || []);
        } catch (err) {
          console.error('Failed to fetch domain recommendations:', err);
          setDomainRecommendations([]);
        }
      }
    } catch (err) {
      console.error('Failed to check domain discovery sessions:', err);
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

  const handleListen = () => {
    speakText(instructions);
  };

  const handleStartCareerDiscovery = async () => {
    if (!hasReadInstructions) {
      setError('Please read all instructions before proceeding');
      return;
    }

    if (!hasDomainSessions) {
      setError('Please complete Domain Discovery before starting Career Discovery');
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

      // Create a new session
      const session = await careerDiscoveryApi.createSession();
      console.log('Created new session:', session);

      // Navigate to conversation page with session ID
      router.push(`/career-discovery/${session.session_id}/conversations`);
    } catch (err: any) {
      console.error('Failed to start career discovery:', err);
      
      // Check if the error is about missing domain discovery
      if (err?.message?.includes('Domain discovery required') || 
          err?.action_required === 'explore_domain_discovery') {
        setError('Please complete Domain Discovery before starting Career Discovery. You will be redirected...');
        setTimeout(() => {
          router.push('/domain-discovery');
        }, 2000);
      } else {
        setError('Failed to start career discovery. Please try again.');
      }
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
    if (session.is_active) {
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
      <div className="mx-auto px-1 py-8">
        {/* Hero Section */}
        <div className="mb-10 flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Left Content */}
          <div className="flex-1">
            <span className="mb-2 bg-linear-to-r from-red-500 via-pink-500 via-purple-500 via-purple-700 via-indigo-600 to-teal-400 bg-clip-text text-2xl font-semibold text-transparent md:text-2xl">
              Career Discovery
            </span>
            <Heading
              level={1}
              variant="web"
              className="font-extrabold text-neutral-900"
            >
              Ready to start
              <br />
              Career Discovery?
            </Heading>
          </div>

          {/* Right - Brain Animation */}
          <div className="shrink-0">
            <BrainWithoutBGLottie loop={true} className="h-[200px] w-[345px]" />
          </div>
        </div>

        {/* Domain Discovery Requirement Banner */}
        {!isCheckingDomain && !hasDomainSessions && (
          <div className="mb-6 rounded-lg border-2 border-blue-300 bg-blue-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500">
                <FiIcon name="info" className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-blue-900">
                  Domain Discovery Required
                </h3>
                <p className="mb-4 text-sm text-blue-800">
                  Before starting Career Discovery, you need to complete Domain Discovery first. 
                  This helps us understand your interests and strengths to provide better career recommendations.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => router.push('/domain-discovery')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Go to Domain Discovery
                </Button>
              </div>
            </div>
          </div>
        )}

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
                              Progress: {session.current_step}/{session.total_steps}{' '}
                              questions •{' '}
                              {session.current_phase === 'profile'
                                ? 'Profile Builder'
                                : 'Career Explorer'}
                              {session.domain_session_id && (
                                <span className="ml-2 text-xs text-gray-500">
                                  (Based on Domain: {session.domain_session_id.substring(0, 8)}...)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {session.is_active ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResumeSession(session.session_id)}
                                className="border-purple-500 text-purple-600 hover:bg-purple-50"
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
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
            <span className="ml-2 text-gray-500">Loading sessions...</span>
          </div>
        )}

        {/* Domain Discovery Session Info */}
        {!isCheckingDomain && hasDomainSessions && latestDomainSession && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500">
                <FiIcon name="check-circle" className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-base font-semibold text-green-900">
                  Based on Your Domain Discovery Session
                </h3>
                <p className="mb-2 text-sm text-green-800">
                  Your career discovery will be personalized based on your most recent domain discovery session:
                </p>
                <div className="rounded-md bg-white p-3 text-sm">
          
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-gray-700">Completed:</span>
                    <span className="text-gray-600">
                      {formatDate(latestDomainSession.created_at)}
                    </span>
                  </div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-gray-700">Progress:</span>
                    <span className="text-gray-600">
                      {latestDomainSession.current_step}/{latestDomainSession.total_steps} questions
                    </span>
                  </div>
                  
                  {/* Domain Recommendations */}
                  {domainRecommendations.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <div className="mb-2 font-medium text-gray-700">
                        Your Top Domains:
                      </div>
                      <div className="space-y-2">
                        {domainRecommendations.slice(0, 3).map((domain, idx) => (
                          <div 
                            key={idx}
                            className="flex items-start gap-2 rounded-md bg-green-50 p-2"
                          >
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {domain.domain_title}
                              </div>
                              <div className="text-xs text-gray-600">
                                {domain.match_percentage}% match
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Box */}
        <div className="mb-6 rounded-lg border border-orange-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {sessions.length > 0
                ? 'Start a New Session'
                : 'Go Through Instructions Before We Start The Module'}
            </h2>
            <Button
              onClick={handleListen}
              variant="outline"
              size="sm"
              className="rounded-md border border-orange-500 bg-orange-50 text-orange-500 hover:bg-orange-100"
            >
              <FiIcon name="volume" className="h-4 w-4" />
              <Label size="md" className="text-orange-500">
                Listen
              </Label>
            </Button>
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
                    Your career recommendations will be based on your Domain Discovery insights 
                    from <strong>{formatDate(latestDomainSession.created_at)}</strong>, 
                    combined with your profile data to provide highly personalized suggestions.
                  </>
                ) : (
                  'We analyze your existing profile data, experiences, and achievements to provide tailored career recommendations.'
                )}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">3</span>
              <span>
                You'll go through a 20-step guided conversation to uncover your
                career preferences and interests.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">4</span>
              <span>
                Receive detailed career matches with salary ranges, next steps,
                and actionable insights to pursue your recommended career paths.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">5</span>
              <span>
                The entire process takes about 30-40 minutes and is completely
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

          <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={hasReadInstructions}
                onCheckedChange={(checked) =>
                  setHasReadInstructions(Boolean(checked))
                }
                className="mt-1"
                disabled={!hasDomainSessions}
              />
              <span className={`text-sm ${!hasDomainSessions ? 'text-gray-400' : 'text-gray-700'}`}>
                I have read all the instructions mentioned above.
              </span>
            </label>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartCareerDiscovery}
            disabled={isLoading || !hasReadInstructions || !hasDomainSessions}
            iconRight={<FiIcon name="arrow-small-right" className="h-5 w-5" />}
            className="mt-6"
          >
            {isLoading
              ? 'Starting...'
              : !hasDomainSessions
                ? 'Complete Domain Discovery First'
                : sessions.length > 0
                  ? 'Start New Session'
                  : 'Start Session'}
          </Button>
        </div>
      </div>
    </div>
  );
}
