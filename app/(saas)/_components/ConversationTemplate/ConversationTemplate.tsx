'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { useToast } from '@/app/_components/Toast';
import { Textarea } from '@/components/ui/textarea';
import { marked } from 'marked';

import { useAudioTranscription } from '@/lib/hooks/useAudioTranscription';
import SessionTimer from '@/app/(saas)/_components/SessionTimer';
import type {
  ConversationConfig,
  ConversationMessage,
} from './types';

/** ================== Transcript Helpers ================== */
function loadTranscript(prefix: string, sessionId: string): ConversationMessage[] {
  try {
    const raw = localStorage.getItem(`${prefix}_${sessionId}`);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveTranscript(
  prefix: string,
  sessionId: string,
  messages: ConversationMessage[],
): void {
  try {
    localStorage.setItem(`${prefix}_${sessionId}`, JSON.stringify(messages));
  } catch {
    /* ignore */
  }
}

/** ================== Component ================== */
interface ConversationTemplateProps {
  config: ConversationConfig;
}

const ConversationTemplate: React.FC<ConversationTemplateProps> = ({ config }) => {
  const {
    featureId,
    featureLabel,
    pageTitle,
    baseRoute,
    transcriptKeyPrefix,
    theme,
    api,
    callbacks,
    slots,
  } = config;

  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string | undefined;
  const { addToast } = useToast();

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);
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

  // Audio transcription (TTS + STT)
  const {
    isSpeaking,
    ttsEnabled,
    setTtsEnabled,
    speakText,
    stopSpeaking,
    isListening,
    liveTranscript,
    setLiveTranscript,
    startListening,
    stopListening,
  } = useAudioTranscription({
    onError: (error) => addToast(error, { type: 'error' }),
  });
  const preInputRef = useRef('');

  // Auto-speak new bot messages when TTS is enabled
  const lastSpokenMsgIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ttsEnabled || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.type === 'bot' && lastMsg.id !== lastSpokenMsgIdRef.current) {
      lastSpokenMsgIdRef.current = lastMsg.id;
      const plainText = lastMsg.content
        .replace(/[#*_~`>]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n{2,}/g, '. ')
        .trim();
      speakText(plainText);
    }
  }, [messages, ttsEnabled, speakText]);

  // Stop speaking when TTS is toggled off
  useEffect(() => {
    if (!ttsEnabled) stopSpeaking();
  }, [ttsEnabled, stopSpeaking]);

  // Sync live STT transcript into the input box
  useEffect(() => {
    if (isListening) {
      const prefix = preInputRef.current;
      const separator = prefix && liveTranscript ? ' ' : '';
      setInput(prefix + separator + liveTranscript);
    }
  }, [liveTranscript, isListening]);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      preInputRef.current = input;
      setLiveTranscript('');
      startListening();
    }
  }, [isListening, input, startListening, stopListening, setLiveTranscript]);

  const canEnd = callbacks.canEndConversation({
    sessionEnded,
    messages,
    questionsCompleted,
  });

  // ─── Initialize session ──────────────────────────────────────
  useEffect(() => {
    if (sessionId) {
      initializeSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function initializeSession(): Promise<void> {
    if (!sessionId) {
      router.push(baseRoute);
      return;
    }

    try {
      setIsLoading(true);

      try {
        const historyResponse = await api.getMessages(sessionId);
        if (historyResponse.messages.length > 0) {
          let sessionInfo = null;
          try {
            sessionInfo = await api.getSession(sessionId);
            if (sessionInfo?.created_at) {
              setSessionCreatedAt(sessionInfo.created_at);
            }
            if (sessionInfo?.metadata) {
              const meta = sessionInfo.metadata;
              if (meta.is_paused) setIsPaused(true);
              if (typeof meta.total_paused_seconds === 'number')
                setTotalPausedSeconds(meta.total_paused_seconds);
            }
          } catch (e) {
            const error = e as { message?: string };
            if (error.message?.includes('No active')) {
              setSessionEnded(true);
              setProgressPercentage(100);
            }
          }

          const parsed = callbacks.parseHistory(historyResponse, sessionInfo);
          setMessages(parsed.messages);
          setQuestionsCompleted(parsed.questionsCompleted);
          setProgressPercentage(parsed.progressPercentage);
          if (parsed.sessionEnded) setSessionEnded(true);
          saveTranscript(transcriptKeyPrefix, sessionId, parsed.messages);
          setIsLoading(false);
          return;
        }
      } catch {
        addToast('Session not found. Please start a new session.', {
          type: 'error',
        });
        router.push(baseRoute);
        return;
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      addToast('Failed to load conversation. Please try again.', {
        type: 'error',
      });
      router.push(baseRoute);
    } finally {
      setIsLoading(false);
    }
  }

  // Persist transcript on change
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      saveTranscript(transcriptKeyPrefix, sessionId, messages);
    }
  }, [messages, sessionId, transcriptKeyPrefix]);

  // Focus input after AI response
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // ─── Pause / Resume ──────────────────────────────────────────
  const handleTogglePause = async (): Promise<void> => {
    if (!sessionId || pauseLoading || sessionEnded) return;
    setPauseLoading(true);
    try {
      const resp = await api.togglePause(sessionId);
      setIsPaused(resp.is_paused);
      setTotalPausedSeconds(resp.total_paused_seconds);
    } catch (error) {
      console.error('Failed to toggle pause:', error);
      addToast('Failed to pause/resume session.', { type: 'error' });
    } finally {
      setPauseLoading(false);
    }
  };

  const isInputBlockedByTimer = isTimerExpired && !debugOverrideTimerBlock;

  // ─── Send message ────────────────────────────────────────────
  async function handleSend(): Promise<void> {
    if (isListening) stopListening();
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
    const studentMsg: ConversationMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, studentMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.sendMessage(sessionId, userMessage);
      const parsed = callbacks.parseSendResponse(response);
      setProgressPercentage(parsed.progressPercentage);
      setQuestionsCompleted(parsed.questionsCompleted);
      if (parsed.sessionEnded) setSessionEnded(true);
      setMessages((prev) => [...prev, parsed.botMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      addToast('Could not get a response. Please try again.', { type: 'error' });
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMessage);
    } finally {
      setIsLoading(false);
    }
  }

  // Option select handler (for modules with choice buttons)
  async function handleOptionSelect(choice: string): Promise<void> {
    if (isLoading || !sessionId) return;
    if (isInputBlockedByTimer) {
      addToast('Time is up! You can no longer send messages.', { type: 'warning' });
      return;
    }
    if (isPaused) {
      addToast('Cannot send message while session is paused. Please resume first.', { type: 'warning' });
      return;
    }

    const studentMsg: ConversationMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: choice,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, studentMsg]);
    setIsLoading(true);

    try {
      const response = await api.sendMessage(sessionId, choice);
      const parsed = callbacks.parseSendResponse(response);
      setProgressPercentage(parsed.progressPercentage);
      setQuestionsCompleted(parsed.questionsCompleted);
      if (parsed.sessionEnded) setSessionEnded(true);
      setMessages((prev) => [...prev, parsed.botMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      addToast('Could not get a response. Please try again.', { type: 'error' });
      setMessages((prev) => prev.slice(0, -1));
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

  // ─── End / View Results ──────────────────────────────────────
  async function handleEnd(): Promise<void> {
    if (!sessionId) return;

    // If there's an exit dialog slot and session isn't ended, show it
    if (slots?.renderExitDialog && !sessionEnded) {
      setShowExitDialog(true);
      return;
    }

    const route = await callbacks.handleEnd({
      sessionId,
      sessionEnded,
      messages,
    });
    if (route) router.push(route);
  }

  async function handleViewResults(): Promise<void> {
    if (!sessionId) return;
    const route = await callbacks.handleEnd({
      sessionId,
      sessionEnded,
      messages,
    });
    if (route) router.push(route);
  }

  function handleConfirmExit(): void {
    setShowExitDialog(false);
    addToast('Exiting without generating results', { type: 'info' });
    router.push(baseRoute);
  }

  function handleCancelExit(): void {
    setShowExitDialog(false);
  }

  // ─── Markdown rendering ──────────────────────────────────────
  const renderMarkdown = (content: string): string => {
    try {
      return marked.parse(content, { async: false }) as string;
    } catch {
      return content;
    }
  };

  // ─── Derived input block reason ──────────────────────────────
  const customInputBlock = slots?.inputBlockReason?.({
    isLoading,
    messages,
    sessionEnded,
  });

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div
      className={`flex h-[calc(100vh-6rem)] min-h-0 bg-linear-to-br ${theme.bgFrom} ${theme.bgTo}`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="border-b bg-white px-4 py-4 shadow-sm md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <Heading level={2} className="text-xl font-semibold text-gray-900">
                  {pageTitle}
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
                    accentColor={theme.timerAccent}
                  />
                )}
                <button
                  onClick={() => setShowDebugDialog(true)}
                  className="group flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-all hover:border-purple-300 hover:bg-purple-100 hover:shadow-sm"
                  title="View debugging information"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span>Debug</span>
                </button>
              </div>
              <Paragraph className="mt-1 text-sm text-gray-600">
                Question {questionsCompleted + 1}
              </Paragraph>

              {/* Progress Bar */}
              <div className="mt-3 w-full">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full bg-linear-to-r ${theme.bubbleFrom} ${theme.bubbleTo} transition-all duration-300`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            {canEnd && (
              <button
                onClick={sessionEnded ? handleViewResults : handleEnd}
                className={`ml-4 cursor-pointer whitespace-nowrap rounded-lg bg-linear-to-r ${theme.ctaFrom} ${theme.ctaTo} px-4 py-2 text-white hover:${theme.ctaHoverFrom} hover:${theme.ctaHoverTo}`}
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
          {messages.map((m, index) => {
            const isLatest = m.type === 'bot' && index === messages.length - 1;

            return (
              <div
                key={m.id}
                className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`${m.type === 'user' ? 'text-right' : 'w-full text-left'}`}>
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      m.type === 'user'
                        ? `ml-12 bg-linear-to-r ${theme.bubbleFrom} ${theme.bubbleTo} text-white`
                        : 'border bg-white text-gray-900 shadow-sm'
                    } `}
                  >
                    {m.type === 'user' ? (
                      <Paragraph className="text-white">{m.content}</Paragraph>
                    ) : (
                      <div
                        className="prose prose-sm max-w-none text-gray-900 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-0 [&_p]:mb-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                      />
                    )}
                  </div>

                  {/* Module-specific extras (e.g. choice buttons) */}
                  {m.type === 'bot' &&
                    slots?.renderBotMessageExtra?.({
                      message: m,
                      isLatest,
                      isLoading,
                      onOptionSelect: handleOptionSelect,
                    })}

                  <div
                    className={`mt-1 text-xs ${m.type === 'user' ? theme.userTimestampColor : 'text-gray-500'}`}
                  >
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && !sessionEnded && (
            <div className="flex justify-start">
              <div className="max-w-3xl">
                <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
                  <span className="text-sm text-gray-500">
                    {slots?.loadingText ?? 'AI is thinking…'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Completion banner */}
          {canEnd &&
            slots?.renderCompletionBanner?.({
              sessionId: sessionId || '',
              onViewResults: handleViewResults,
            })}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-white px-6 py-4">
          {sessionEnded ? (
            <div className="text-center text-sm text-gray-600">
              ✅ This session has ended. Click &quot;View Results&quot; above to see your recommendations.
            </div>
          ) : isInputBlockedByTimer ? (
            <div className="text-center text-sm text-red-600">
              ⏰ Time is up! You can no longer send messages.
            </div>
          ) : customInputBlock ? (
            <div className="text-center text-sm text-gray-600">{customInputBlock}</div>
          ) : isLoading ? (
            <div className="text-center text-sm text-gray-600">⏳</div>
          ) : (
            <>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? 'Listening…' : 'Type your response…'}
                    className="min-h-10! py-2!"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleMicToggle}
                    disabled={isLoading}
                    className={`rounded-lg border px-3 py-2 transition-colors ${
                      isListening
                        ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        🎤
                      </span>
                    ) : (
                      '🎤'
                    )}
                  </button>
                  {/* <button
                    onClick={() => setTtsEnabled(!ttsEnabled)}
                    className={`rounded-lg border px-3 py-2 transition-colors ${
                      ttsEnabled
                        ? 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    title={ttsEnabled ? 'Disable auto-read' : 'Enable auto-read'}
                  >
                    {isSpeaking ? '🔊' : ttsEnabled ? '🔈' : '🔇'}
                  </button> */}
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Send
                  </button>
                  {canEnd && (
                    <button
                      onClick={handleEnd}
                      className={`cursor-pointer whitespace-nowrap rounded-lg bg-linear-to-r ${theme.ctaFrom} ${theme.ctaTo} px-4 py-2 text-white hover:${theme.ctaHoverFrom} hover:${theme.ctaHoverTo}`}
                    >
                      End →
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {isListening ? (
                  <span className="text-red-500">
                    🎤 Listening… Click mic or send to stop.
                  </span>
                ) : (
                  <>
                    Tip: Press <span className="font-semibold">Enter</span> to send,{' '}
                    <span className="font-semibold">Shift+Enter</span> for a new line.
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Exit Confirmation Dialog (optional) */}
      {showExitDialog &&
        slots?.renderExitDialog?.({
          onConfirm: handleConfirmExit,
          onCancel: handleCancelExit,
        })}

      {/* Debug Dialog */}
      {sessionId &&
        slots?.renderDebugDialog?.({
          open: showDebugDialog,
          onOpenChange: setShowDebugDialog,
          sessionId,
          isTimerExpired,
          debugOverrideTimerBlock,
          onDebugOverrideTimerBlockChange: setDebugOverrideTimerBlock,
        })}
    </div>
  );
};

export default ConversationTemplate;
