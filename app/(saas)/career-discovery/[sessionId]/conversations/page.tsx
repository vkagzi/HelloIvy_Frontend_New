'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { useToast } from '@/app/_components/Toast';
import { Textarea } from '@/components/ui/textarea';
import {
  careerDiscoveryApi,
  SendMessageResponse,
} from '@/lib/career-discovery-api';
import { marked } from 'marked';
import { Button } from '@/components/ui/button';
import { CareerDebugDialog } from '@/components/CareerDebugDialog';
import SessionTimer from '@/app/(saas)/_components/SessionTimer';
import { useRealtimeVoice } from '@/lib/hooks/useRealtimeVoice';

type Role = 'bot' | 'user';
type ConversationMode = 'chat' | 'voice';

interface Message {
  id: string;
  type: Role;
  content: string;
  timestamp: string; // ISO
}

/** ================== Transcript Helpers ================== */
function saveTranscript(sessionId: string, messages: Message[]): void {
  try {
    localStorage.setItem(
      `career_conversation_transcript_${sessionId}`,
      JSON.stringify(messages)
    );
  } catch {
    /* ignore */
  }
}

const CareerConversationPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string | undefined;
  const { addToast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(20); // Default value
  const [isGeneratingResults, setIsGeneratingResults] = useState(false);
  const [resultsGenerationFailed, setResultsGenerationFailed] = useState(false);
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [totalPausedSeconds, setTotalPausedSeconds] = useState(0);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [debugOverrideTimerBlock, setDebugOverrideTimerBlock] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Voice conversation mode
  const [conversationMode, setConversationMode] = useState<ConversationMode>('chat');

  // Realtime voice hook (manual connect/disconnect)
  const {
    isConnected: voiceConnected,
    isConnecting: voiceConnecting,
    isRecording: voiceRecording,
    isSpeaking: voiceSpeaking,
    transcript: voiceTranscript,
    connectVoice,
    disconnectVoice,
    toggleRecording: toggleVoiceRecording,
    stopAudio: stopVoiceAudio,
  } = useRealtimeVoice({
    sessionId: sessionId || '',
    feature: 'career-discovery',
    label: 'CareerDiscovery',
    onError: (error) => {
      addToast(`Voice error: ${error}`, { type: 'error' });
      setConversationMode('chat');
    },
  });

  // Sync voice transcript to main messages list so they persist
  const prevVoiceTranscriptLenRef = useRef(0);
  useEffect(() => {
    if (conversationMode !== 'voice' || voiceTranscript.length === 0) return;

    if (voiceTranscript.length > prevVoiceTranscriptLenRef.current) {
      const newEntries = voiceTranscript.slice(prevVoiceTranscriptLenRef.current);
      const newMessages: Message[] = newEntries.map((t, idx) => ({
        id: `voice-${Date.now()}-${prevVoiceTranscriptLenRef.current + idx}`,
        type: t.role === 'assistant' ? 'bot' : 'user',
        content: t.content,
        timestamp: t.timestamp.toISOString(),
      }));
      setMessages((prev) => [...prev, ...newMessages]);
      prevVoiceTranscriptLenRef.current = voiceTranscript.length;
    } else {
      const lastTranscript = voiceTranscript[voiceTranscript.length - 1];
      setMessages((prev) => {
        const expectedType = lastTranscript.role === 'assistant' ? 'bot' : 'user';
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].type === expectedType && prev[i].id.startsWith('voice-')) {
            if (prev[i].content === lastTranscript.content) return prev;
            const updated = [...prev];
            updated[i] = { ...updated[i], content: lastTranscript.content };
            return updated;
          }
        }
        return prev;
      });
    }
  }, [voiceTranscript, conversationMode]);

  /** Activate voice mode: connect WS, seed chat history, open mic */
  const activateVoiceMode = useCallback(async () => {
    const chatHistory = messages.map((m) => ({
      role: (m.type === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    }));
    const lastBot = [...messages].reverse().find((m) => m.type === 'bot');
    setConversationMode('voice');
    await connectVoice(chatHistory, lastBot?.content);
  }, [messages, connectVoice]);

  /** Deactivate voice mode: tear down WS, return to chat */
  const deactivateVoiceMode = useCallback(() => {
    disconnectVoice();
    prevVoiceTranscriptLenRef.current = 0;
    setConversationMode('chat');
  }, [disconnectVoice]);

  const userAnswerCount = useMemo(
    () => messages.filter((m) => m.type === 'user').length,
    [messages]
  );
  const allQuestionsCompleted = userAnswerCount >= totalQuestions;

  // Initialize session on mount
  useEffect(() => {
    if (sessionId) {
      initializeSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function initializeSession(): Promise<void> {
    if (!sessionId) {
      router.push('/career-discovery');
      return;
    }

    try {
      setIsLoading(true);

      // Try to load existing session
      try {
        const historyResponse = await careerDiscoveryApi.getMessages(sessionId);
        if (historyResponse.messages.length > 0) {
          // Restore existing session
          setTotalQuestions(
            historyResponse.total_questions || historyResponse.total_steps || 20
          );

          // Try to get session details for timer
          try {
            const sessionResp = await careerDiscoveryApi.getSession(sessionId);
            if (sessionResp) {
              if (sessionResp.created_at) {
                setSessionCreatedAt(sessionResp.created_at);
              }

              // Restore pause state from metadata
              if (sessionResp.metadata) {
                const meta = sessionResp.metadata as Record<string, unknown>;
                if (meta.is_paused) setIsPaused(true);
                if (typeof meta.total_paused_seconds === 'number') setTotalPausedSeconds(meta.total_paused_seconds);
              }
              const completed = historyResponse.current_step;
              setQuestionsCompleted(completed);
              const total =
                historyResponse.total_questions ||
                historyResponse.total_steps ||
                20;
              setProgressPercentage(Math.round((completed / total) * 100));
            }
          } catch (e) {
            const err = e as { message?: string };
            if (
              err.message?.includes('No active career discovery session found')
            ) {
              setSessionEnded(true);
              setProgressPercentage(100);
              setQuestionsCompleted(totalQuestions);
            }
          }

          const loadedMessages: Message[] = historyResponse.messages.map(
            (m) => ({
              id: m.message_id,
              type: m.type,
              content: m.content,
              timestamp: m.timestamp,
            })
          );
          setMessages(loadedMessages);
          saveTranscript(sessionId!, loadedMessages);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error(
          'Could not restore session, redirecting to career page',
          error
        );
        addToast('Session not found. Please start a new session.', {
          type: 'error',
        });
        router.push('/career-discovery');
        return;
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      addToast('Failed to load conversation. Please try again.', {
        type: 'error',
      });
      router.push('/career-discovery');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (sessionId && messages.length > 0) {
      saveTranscript(sessionId, messages);
    }
  }, [messages, sessionId]);

  // Focus input after AI response
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Toggle pause/resume
  const handleTogglePause = async (): Promise<void> => {
    if (!sessionId || pauseLoading || sessionEnded) return;
    setPauseLoading(true);
    try {
      const resp = await careerDiscoveryApi.togglePause(sessionId);
      setIsPaused(resp.is_paused);
      setTotalPausedSeconds(resp.total_paused_seconds);
    } catch (error) {
      console.error('Failed to toggle pause:', error);
      addToast('Failed to pause/resume session.', { type: 'error' });
    } finally {
      setPauseLoading(false);
    }
  };

  // Whether input should be blocked due to timer expiry
  const isInputBlockedByTimer = isTimerExpired && !debugOverrideTimerBlock;

  async function handleSend(): Promise<void> {
    if (!input.trim() || isLoading || !sessionId) return;
    if (isInputBlockedByTimer) {
      addToast('Time is up! You can no longer send messages.', { type: 'warning' });
      return;
    }
    if (isPaused) {
      addToast('Cannot send message while session is paused. Please resume first.', { type: 'warning' });
      return;
    }

    const userMessage = input.trim();

    // Add user message to UI immediately
    const studentMsg: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, studentMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Send message to backend and get AI response
      const response: SendMessageResponse =
        await careerDiscoveryApi.sendMessage(sessionId, userMessage);

      // Update step and progress tracking
      const total = response.total_steps || totalQuestions;
      setQuestionsCompleted(response.current_step);
      setProgressPercentage(Math.round((response.current_step / total) * 100));

      // Check if conversation is complete
      if (response.is_complete) {
        // Add final bot message
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: response.bot_response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMsg]);
        return;
      }

      // Add bot response
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: response.bot_response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Failed to send message:', error);
      addToast('Could not get a response. Please try again.', {
        type: 'error',
      });
      // Remove the user message if we failed
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMessage);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleEnd(): Promise<void> {
    if (!allQuestionsCompleted) return;
    await generateAndShowResults();
  }

  async function generateAndShowResults(): Promise<void> {
    if (!sessionId) return;

    setIsGeneratingResults(true);
    setResultsGenerationFailed(false);

    // Add a notification message in the chat
    const generatingMsg: Message = {
      id: `system-${Date.now()}`,
      type: 'bot',
      content:
        '🔄 Generating your personalized career recommendations... This may take a moment.',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, generatingMsg]);
    addToast('Generating your career recommendations…', { type: 'success' });

    try {
      // End session on server
      try {
        await careerDiscoveryApi.endSession(sessionId);
      } catch (err) {
        console.error('Could not end session on server', err);
      }

      // Generate recommendations
      const result =
        await careerDiscoveryApi.generateRecommendations(sessionId);
      if (result.recommendations && result.recommendations.length > 0) {
        // Remove the generating message
        setMessages((prev) => prev.filter((m) => m.id !== generatingMsg.id));
        // Add success message
        const successMsg: Message = {
          id: `system-${Date.now()}`,
          type: 'bot',
          content:
            '✅ Your career recommendations are ready! Click the button below to view them.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, successMsg]);
        addToast('Your results are ready!', { type: 'success' });
      } else {
        throw new Error('No recommendations generated');
      }
    } catch (genError) {
      console.error('Failed to generate recommendations:', genError);
      // Remove the generating message
      setMessages((prev) => prev.filter((m) => m.id !== generatingMsg.id));
      // Add error message
      const errorMsg: Message = {
        id: `system-${Date.now()}`,
        type: 'bot',
        content:
          '❌ There was an issue generating your recommendations. Please try again or contact support.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setResultsGenerationFailed(true);
      addToast('Failed to generate recommendations. Please try again.', {
        type: 'error',
      });
    } finally {
      setIsGeneratingResults(false);
    }
  }

  async function handleViewResults(): Promise<void> {
    if (!sessionId) return;
    router.push(`/career-discovery/${sessionId}/results`);
  }

  // Convert markdown to HTML
  const renderMarkdown = (content: string): string => {
    try {
      return marked.parse(content, { async: false }) as string;
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return content;
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] min-h-0 bg-linear-to-br from-purple-50 to-blue-100">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="border-b bg-white px-4 py-4 shadow-sm md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <Heading
                  level={2}
                  className="text-xl font-semibold text-gray-900"
                >
                  🚀 Career Discovery Journey
                </Heading>
                {sessionCreatedAt && (
                  <SessionTimer
                    sessionCreatedAt={sessionCreatedAt}
                    isPaused={isPaused}
                    totalPausedSeconds={totalPausedSeconds}
                    pauseLoading={pauseLoading}
                    sessionEnded={sessionEnded}
                    onTogglePause={handleTogglePause}
                    onTimeExpired={() => setIsTimerExpired(true)}
                    accentColor="purple"
                  />
                )}
                {conversationMode === 'voice' && (
                  <button
                    onClick={deactivateVoiceMode}
                    className="group flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:border-blue-400 hover:bg-blue-100 hover:shadow-sm"
                    title="Switch back to text chat"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Back to Chat</span>
                  </button>
                )}
                <button
                  onClick={() => setShowDebugDialog(true)}
                  className="group flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-all hover:border-purple-300 hover:bg-purple-100 hover:shadow-sm"
                  title="View debugging information"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  <span>Debug</span>
                </button>
              </div>
              <Paragraph className="mt-1 text-sm text-gray-600">
                Question {questionsCompleted+1}
              </Paragraph>

              {/* Progress Bar */}
              <div className="mt-3 w-full">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-linear-to-r from-purple-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            {allQuestionsCompleted && (
              <button
                onClick={handleEnd}
                className="ml-4 rounded-lg bg-linear-to-r from-purple-600 to-blue-600 px-4 py-2 whitespace-nowrap text-white hover:from-purple-700 hover:to-blue-700"
              >
                View Results →
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-4"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`${m.type === 'user' ? 'text-right' : 'w-full text-left'}`}
              >
                <div
                  className={`rounded-lg px-4 py-3 ${
                    m.type === 'user'
                      ? 'ml-12 bg-linear-to-r from-purple-500 to-blue-500 text-white'
                      : 'border bg-white text-gray-900 shadow-sm'
                  } `}
                >
                  {m.type === 'user' ? (
                    <Paragraph className="text-white">{m.content}</Paragraph>
                  ) : (
                    <div
                      className="prose prose-sm max-w-none text-gray-900 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-0 [&_p]:mb-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(m.content),
                      }}
                    />
                  )}
                </div>
                <div
                  className={`mt-1 text-xs ${m.type === 'user' ? 'text-purple-100' : 'text-gray-500'}`}
                >
                  {new Date(m.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && !allQuestionsCompleted && (
            <div className="flex justify-start">
              <div className="max-w-3xl">
                <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
                  <span className="text-sm text-gray-500">
                    Career AI is thinking…
                  </span>
                </div>
              </div>
            </div>
          )}

          {allQuestionsCompleted &&
            !isGeneratingResults &&
            !resultsGenerationFailed && (
              <div className="flex justify-center">
                <div className="max-w-3xl">
                  <div className="rounded-lg border-2 border-green-300 bg-green-50 px-6 py-4 text-center shadow-sm">
                    <p className="mb-4 text-sm font-semibold text-green-900">
                      🎉 All questions completed!
                    </p>
                    <p className="mb-4 text-sm text-green-800">
                      You&apos;ve completed all questions.
                      Click below to generate your personalized career
                      recommendations.
                    </p>
                    <button
                      onClick={handleViewResults}
                      className="rounded-lg bg-linear-to-r from-purple-600 to-blue-600 px-6 py-2 text-white hover:from-purple-700 hover:to-blue-700"
                    >
                      View Results →
                    </button>
                  </div>
                </div>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t bg-white px-6 py-4">
          {sessionEnded ? (
            <div className="text-center text-sm text-gray-600">
              ✅ This session has ended. Click &quot;View Your Results&quot;
              above to see your career recommendations.
            </div>
          ) : isInputBlockedByTimer ? (
            <div className="text-center text-sm text-red-600">
              ⏰ Time is up! You can no longer send messages.
            </div>
          ) : isLoading ? (
            <div className="text-center text-sm text-gray-600">⏳</div>
          ) : (
            <>
              {conversationMode === 'voice' ? (
                // Voice mode controls
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={toggleVoiceRecording}
                      disabled={!voiceConnected}
                      className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
                        voiceRecording
                          ? 'animate-pulse bg-red-500 shadow-lg shadow-red-500/50'
                          : voiceConnected
                          ? 'bg-purple-500 hover:bg-purple-600 hover:shadow-lg'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                      title={voiceRecording ? 'Stop speaking' : 'Start speaking'}
                    >
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>

                    {voiceSpeaking && (
                      <button
                        onClick={stopVoiceAudio}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 hover:bg-orange-600"
                        title="Stop AI speaking"
                      >
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                      </button>
                    )}

                    <button
                      onClick={deactivateVoiceMode}
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                      title="Back to text chat"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  </div>

                  <div className="text-center">
                    {voiceConnecting ? (
                      <p className="text-sm text-orange-600">
                        ⏳ Connecting to voice service...
                      </p>
                    ) : voiceRecording ? (
                      <p className="text-sm font-semibold text-red-600">
                        🎤 Listening... speak now
                      </p>
                    ) : voiceSpeaking ? (
                      <p className="text-sm font-semibold text-purple-600">
                        🔊 AI is speaking...
                      </p>
                    ) : voiceConnected ? (
                      <p className="text-sm text-gray-600">
                        Click the mic to start speaking
                      </p>
                    ) : (
                      <p className="text-sm text-orange-600">
                        Connecting to voice service...
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                // Chat mode controls
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your response…"
                      className="min-h-10! py-2!"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex space-x-2">
                    {/* Mic button: starts real-time voice mode */}
                    <Button
                      variant="icon-outline"
                      onClick={activateVoiceMode}
                      disabled={isLoading || voiceConnecting}
                      className="px-3 py-2 transition-colors"
                      title="Switch to voice conversation"
                    >
                      {voiceConnecting ? (
                        <div className="flex items-center space-x-1">
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
                        </div>
                      ) : (
                        '🎤'
                      )}
                    </Button>

                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Send
                    </button>
                    {allQuestionsCompleted && (
                      <button
                        onClick={handleEnd}
                        className="rounded-lg bg-linear-to-r from-purple-600 to-blue-600 px-4 py-2 whitespace-nowrap text-white hover:from-purple-700 hover:to-blue-700"
                      >
                        End →
                      </button>
                    )}
                  </div>
                </div>
              )}
              {conversationMode === 'chat' && (
                <div className="mt-2 text-xs text-gray-500">
                  Tip: Press <span className="font-semibold">Enter</span> to send,{' '}
                  <span className="font-semibold">Shift+Enter</span> for a new
                  line.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {sessionId && (
        <CareerDebugDialog
          open={showDebugDialog}
          onOpenChange={setShowDebugDialog}
          sessionId={sessionId}
          isTimerExpired={isTimerExpired}
          debugOverrideTimerBlock={debugOverrideTimerBlock}
          onDebugOverrideTimerBlockChange={setDebugOverrideTimerBlock}
        />
      )}
    </div>
  );
};

export default CareerConversationPage;
