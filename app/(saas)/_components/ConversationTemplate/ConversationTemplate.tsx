'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { useToast } from '@/app/_components/Toast';
import { FiIcon } from '@/app/_components/Icons';
import { Textarea } from '@/components/ui/textarea';
import imgIcon from '@/assets/images/icon.png';
import { marked } from 'marked';

// import { useAudioTranscription } from '@/lib/hooks/useAudioTranscription';
import { useRealtimeVoice } from '@/lib/hooks/useRealtimeVoice';
import apiClient from '@/lib/api-client';
import AudioWaveform from './AudioWaveform';
import VoiceActivityBars from './VoiceActivityBars';
import SessionTimer from '@/app/(saas)/_components/SessionTimer';
import CommunicationModeModal from './CommunicationModeModal';
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

  // Communication mode selection modal
  const [showModeModal, setShowModeModal] = useState(true);

  // Realtime voice mode
  const [conversationMode, setConversationMode] = useState<'chat' | 'voice'>('chat');
  const [isVoiceEnded, setIsVoiceEnded] = useState(false);
  const voiceSessionRef = useRef(0);

  // Map voice_persona preference to OpenAI Realtime voice name
  const VOICE_MAP: Record<string, string> = { male: 'cedar', female: 'marin' };
  const [realtimeVoiceName, setRealtimeVoiceName] = useState<string | undefined>(undefined);
  useEffect(() => {
    apiClient<{ settings: { voice_persona?: string } }>('/api/accounts/settings/')
      .then((data) => {
        const persona = data.settings?.voice_persona || 'male';
        setRealtimeVoiceName(VOICE_MAP[persona] || 'cedar');
      })
      .catch(() => setRealtimeVoiceName('cedar'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    isConnected: voiceConnected,
    isConnecting: voiceConnecting,
    isRecording: voiceRecording,
    isSpeaking: voiceSpeaking,
    isDisconnecting: voiceDisconnecting,
    transcript: voiceTranscript,
    realtimeTokenUsage,
    audioLevel: voiceAudioLevel,
    connectVoice,
    disconnectVoice,
    toggleRecording: toggleVoiceRecording,
  } = useRealtimeVoice({
    sessionId: sessionId || '',
    feature: featureId,
    label: featureLabel,
    voice: realtimeVoiceName,
    onError: (error) => {
      addToast(`Voice error: ${error}`, { type: 'error' });
      setConversationMode('chat');
    },
    onSessionProgress: (progress) => {
      setQuestionsCompleted(progress.questions_completed);
      setProgressPercentage(progress.progress_percentage);
      if (progress.is_completed) setSessionEnded(true);
    },
  });

  // Sync voice transcript to main messages list.
  // Uses full reconciliation: the transcript array is the single source of
  // truth for voice messages.  A per-session prefix ensures that messages
  // from a previous voice session are preserved as regular chat entries.
  useEffect(() => {
    if (conversationMode !== 'voice' || voiceTranscript.length === 0) return;

    const prefix = `voice-s${voiceSessionRef.current}-`;

    setMessages((prev) => {
      // Keep all messages that don't belong to the *current* voice session
      const base = prev.filter((m) => !m.id.startsWith(prefix));

      // Rebuild current-session voice messages from the authoritative transcript
      const voiceMessages: ConversationMessage[] = voiceTranscript.map((t, idx) => ({
        id: `${prefix}${idx}`,
        type: (t.role === 'assistant' ? 'bot' : 'user') as 'bot' | 'user',
        content: t.content,
        timestamp: t.timestamp.toISOString(),
        medium: 'voice' as const,
      }));

      const merged = [...base, ...voiceMessages];

      // Skip update when nothing actually changed (avoids render churn)
      if (
        merged.length === prev.length &&
        merged.every((m, i) => m.id === prev[i].id && m.content === prev[i].content)
      ) {
        return prev;
      }

      return merged;
    });
  }, [voiceTranscript, conversationMode]);

  const activateVoiceMode = useCallback(async () => {
    setIsVoiceEnded(false);
    voiceSessionRef.current += 1;
    // Insert a medium-switch indicator
    const switchMsg: ConversationMessage = {
      id: `switch-to-voice-${Date.now()}`,
      type: 'system',
      content: 'Switched to voice mode',
      timestamp: new Date().toISOString(),
      medium: 'voice',
    };
    setMessages((prev) => [...prev, switchMsg]);
    const chatHistory = messages
      .filter((m) => m.type !== 'system')
      .map((m) => ({
        role: (m.type === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      }));
    const lastBot = [...messages].reverse().find((m) => m.type === 'bot');
    setConversationMode('voice');
    await connectVoice(chatHistory, lastBot?.content);
  }, [messages, connectVoice]);

  const deactivateVoiceMode = useCallback(async () => {
    await disconnectVoice();
    // Insert a medium-switch indicator
    const switchMsg: ConversationMessage = {
      id: `switch-to-text-${Date.now()}`,
      type: 'system',
      content: 'Switched to text mode',
      timestamp: new Date().toISOString(),
      medium: 'text',
    };
    setMessages((prev) => [...prev, switchMsg]);
    setIsVoiceEnded(true);
    setTimeout(() => {
      setIsVoiceEnded(false);
      setConversationMode('chat');
    }, 2000);
  }, [disconnectVoice]);

  // useAudioTranscription commented out — realtime voice is used instead
  // const {
  //   isSpeaking,
  //   ttsEnabled,
  //   setTtsEnabled,
  //   speakText,
  //   stopSpeaking,
  //   isListening,
  //   liveTranscript,
  //   setLiveTranscript,
  //   startListening,
  //   stopListening,
  //   audioLevel,
  // } = useAudioTranscription({
  //   onError: (error) => addToast(error, { type: 'error' }),
  // });

  // Mic toggle now activates/deactivates realtime voice
  const handleMicToggle = useCallback(async () => {
    if (voiceConnected || voiceConnecting) {
      await deactivateVoiceMode();
    } else {
      await activateVoiceMode();
    }
  }, [voiceConnected, voiceConnecting, activateVoiceMode, deactivateVoiceMode]);

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
      medium: 'text',
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
      medium: 'text',
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

            // System messages (e.g. medium-switch indicators)
            if (m.type === 'system') {
              return (
                <div key={m.id} className="flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                    {m.medium === 'voice' ? (
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    ) : (
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    )}
                    {m.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`flex ${m.type === 'user' ? 'justify-end' : 'items-start gap-3'}`}
              >
                {/* Bot avatar */}
                {m.type === 'bot' && (
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center${
                    voiceConnected && index === messages.length - 1 ? ' animate-pulse' : ''
                  }`}>
                    <Image src={imgIcon} alt="HelloIvy" className={`object-contain h-full w-full${
                      voiceConnected && index === messages.length - 1 ? ' drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]' : ''
                    }`} />
                  </div>
                )}
                <div className={`${m.type === 'user' ? 'text-right' : 'min-w-0 flex-1 text-left'}`}>
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
        <div className="border-t border-neutral-200 bg-white px-6 py-4">
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
              {/* Input bar */}
              {voiceConnected || voiceConnecting ? (
                /* ── Realtime voice active: waveform + stop button ── */
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-2 shadow-sm">
                  {/* Pulsing mic indicator */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      voiceConnecting ? 'animate-ping bg-orange-400' : 'animate-pulse bg-emerald-500'
                    }`} />
                  </span>

                  {/* Waveform */}
                  <div className="h-8 flex-1">
                    <AudioWaveform
                      level={voiceAudioLevel}
                      active={voiceRecording}
                      color={voiceSpeaking ? 'rgba(99, 102, 241, 0.7)' : 'rgba(16, 185, 129, 0.7)'}
                      trackColor="rgba(209, 213, 219, 0.45)"
                    />
                  </div>

                  {/* Voice status label */}
                  <span className="text-xs font-medium whitespace-nowrap">
                    {voiceConnecting ? (
                      <span className="text-orange-600">Connecting…</span>
                    ) : voiceSpeaking ? (
                      <span className="text-indigo-600">Bot speaking</span>
                    ) : voiceRecording ? (
                      <span className="text-emerald-600">Listening…</span>
                    ) : (
                      <span className="text-gray-500">Connected</span>
                    )}
                  </span>

                  {/* Stop voice — mic-off button */}
                  <button
                    onClick={handleMicToggle}
                    type="button"
                    className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-red-100 text-red-500 transition-colors hover:bg-red-200"
                    title="Stop voice"
                  >
                    <FiIcon name="microphone" className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                /* ── Default state: normal text input bar ── */
                <div className="flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-3 py-1.5 shadow-sm transition-all">
                  <Textarea
                    id='user-message'
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder='Type your response…'
                    className="min-h-9! max-h-32 flex-1 resize-none border-0! bg-transparent! py-1.5! text-gray-900 shadow-none! outline-none! ring-0! placeholder:text-gray-400 focus:ring-0! focus-visible:ring-0!"
                    disabled={isLoading}
                  />

                  {/* Mic button — starts realtime voice */}
                  <button
                    onClick={handleMicToggle}
                    disabled={isLoading || sessionEnded}
                    type="button"
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Start voice conversation"
                  >
                    <FiIcon name="microphone" className="h-4 w-4" />
                  </button>

                  {/* Submit button */}
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    type="button"
                    className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-linear-to-r ${theme.ctaFrom} ${theme.ctaTo} text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40`}
                    title="Send message"
                  >
                    <FiIcon name="arrow-up" className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Footer row: status hint + End button */}
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {voiceConnected ? (
                    <span className="text-emerald-500">Realtime voice active — click mic to stop.</span>
                  ) : (
                    <>Press <span className="font-semibold text-gray-600">Enter</span> to send, <span className="font-semibold text-gray-600">Shift+Enter</span> for new line.</>
                  )}
                </p>
                {canEnd && (
                  <button
                    onClick={handleEnd}
                    className={`cursor-pointer whitespace-nowrap rounded-lg bg-linear-to-r ${theme.ctaFrom} ${theme.ctaTo} px-4 py-1.5 text-sm text-white hover:${theme.ctaHoverFrom} hover:${theme.ctaHoverTo}`}
                  >
                    End →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Communication Mode Selection Modal */}
      <CommunicationModeModal
        open={showModeModal}
        onSelectText={() => setShowModeModal(false)}
        onSelectVoice={() => {
          setShowModeModal(false);
          // small delay so the modal closes first
          setTimeout(() => activateVoiceMode(), 300);
        }}
      />

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
          realtimeTokenUsage,
        })}
    </div>
  );
};

export default ConversationTemplate;
