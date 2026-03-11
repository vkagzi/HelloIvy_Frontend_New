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

import { useAudioTranscription } from '@/lib/hooks/useAudioTranscription';
import { useRealtimeVoice } from '@/lib/hooks/useRealtimeVoice';
import AudioWaveform from './AudioWaveform';
import VoiceActivityBars from './VoiceActivityBars';
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

  // Realtime voice mode
  const [conversationMode, setConversationMode] = useState<'chat' | 'voice'>('chat');
  const [isVoiceEnded, setIsVoiceEnded] = useState(false);
  const prevVoiceTranscriptLenRef = useRef(0);

  const {
    isConnected: voiceConnected,
    isConnecting: voiceConnecting,
    isRecording: voiceRecording,
    isSpeaking: voiceSpeaking,
    isDisconnecting: voiceDisconnecting,
    transcript: voiceTranscript,
    realtimeTokenUsage,
    connectVoice,
    disconnectVoice,
    toggleRecording: toggleVoiceRecording,
  } = useRealtimeVoice({
    sessionId: sessionId || '',
    feature: featureId,
    label: featureLabel,
    onError: (error) => {
      addToast(`Voice error: ${error}`, { type: 'error' });
      setConversationMode('chat');
    },
  });

  // Sync voice transcript to main messages list (streaming deltas included)
  useEffect(() => {
    if (conversationMode !== 'voice' || voiceTranscript.length === 0) return;
    if (voiceTranscript.length > prevVoiceTranscriptLenRef.current) {
      const newEntries = voiceTranscript.slice(prevVoiceTranscriptLenRef.current);
      const newMessages: ConversationMessage[] = newEntries.map((t, idx) => ({
        id: `voice-${Date.now()}-${prevVoiceTranscriptLenRef.current + idx}`,
        type: t.role === 'assistant' ? 'bot' : 'user',
        content: t.content,
        timestamp: t.timestamp.toISOString(),
      }));
      setMessages((prev) => [...prev, ...newMessages]);
      prevVoiceTranscriptLenRef.current = voiceTranscript.length;
    } else {
      // Streaming delta: update last matching voice message
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

  const activateVoiceMode = useCallback(async () => {
    setIsVoiceEnded(false);
    const chatHistory = messages.map((m) => ({
      role: (m.type === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    }));
    const lastBot = [...messages].reverse().find((m) => m.type === 'bot');
    setConversationMode('voice');
    await connectVoice(chatHistory, lastBot?.content);
  }, [messages, connectVoice]);

  const deactivateVoiceMode = useCallback(async () => {
    await disconnectVoice();
    prevVoiceTranscriptLenRef.current = 0;
    setIsVoiceEnded(true);
    setTimeout(() => {
      setIsVoiceEnded(false);
      setConversationMode('chat');
    }, 2000);
  }, [disconnectVoice]);

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
    audioLevel,
  } = useAudioTranscription({
    onError: (error) => addToast(error, { type: 'error' }),
  });
  const preInputRef = useRef('');
  const liveTranscriptRef = useRef(liveTranscript);
  liveTranscriptRef.current = liveTranscript;

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

  // Accept: commit the live transcript to input and stop recording
  const handleAcceptTranscript = useCallback(async () => {
    // stopListening commits the audio buffer and returns the final
    // transcript directly (avoids React state-update timing issues).
    const finalTranscript = await stopListening();
    // Use whichever is available: the committed final transcript, or
    // the latest live transcript we saw before stopping.
    const transcript = finalTranscript || liveTranscriptRef.current;
    if (transcript) {
      const prefix = preInputRef.current;
      const separator = prefix && transcript ? ' ' : '';
      setInput(prefix + separator + transcript);
    }
  }, [stopListening]);

  // Reject: discard audio buffer and stop recording
  const handleRejectTranscript = useCallback(async () => {
    await stopListening();
    setInput(preInputRef.current);
    setLiveTranscript('');
  }, [stopListening, setLiveTranscript]);

  const handleMicToggle = useCallback(async () => {
    if (isListening) {
      // Toggling mic while recording = accept
      await handleAcceptTranscript();
    } else {
      preInputRef.current = input;
      setLiveTranscript('');
      startListening();
    }
  }, [isListening, input, startListening, setLiveTranscript, handleAcceptTranscript]);

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
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    ttsEnabled
                      ? 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                  title={ttsEnabled ? 'Disable auto-read' : 'Enable auto-read'}
                >
                  <FiIcon
                    name={isSpeaking ? 'volume' : ttsEnabled ? 'volume-down' : 'mute'}
                    className="h-3.5 w-3.5"
                  />
                  <span>{isSpeaking ? 'Speaking' : ttsEnabled ? 'Voice On' : 'Voice Off'}</span>
                </button>
                {conversationMode === 'voice' ? (
                  <button
                    onClick={deactivateVoiceMode}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:border-blue-400 hover:bg-blue-100 hover:shadow-sm"
                    title="Switch back to text chat"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Back to Chat</span>
                  </button>
                ) : (
                  <button
                    onClick={activateVoiceMode}
                    disabled={voiceConnecting || sessionEnded}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                    title="Try realtime voice conversation"
                  >
                    {voiceConnecting ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                    <span>{voiceConnecting ? 'Connecting…' : 'Try Voice'}</span>
                  </button>
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
                className={`flex ${m.type === 'user' ? 'justify-end' : 'items-start gap-3'}`}
              >
                {/* Bot avatar */}
                {m.type === 'bot' && (
                  <div className=" flex h-10 w-10 shrink-0 items-center justify-center">
                    <Image src={imgIcon} alt="HelloIvy" className="object-contain h-full w-full" />
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
          ) : conversationMode === 'voice' ? (
            /* ── Realtime voice controls ── */
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-4">
                {/* Main voice status button */}
                <button
                  onClick={
                    voiceDisconnecting || isVoiceEnded
                      ? undefined
                      : voiceRecording
                      ? deactivateVoiceMode
                      : toggleVoiceRecording
                  }
                  disabled={!voiceConnected || voiceDisconnecting || isVoiceEnded}
                  className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
                    isVoiceEnded
                      ? 'bg-gray-400'
                      : voiceDisconnecting
                      ? 'bg-amber-500'
                      : voiceSpeaking
                      ? 'bg-indigo-500 shadow-lg shadow-indigo-500/40'
                      : voiceRecording
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40'
                      : voiceConnected
                      ? 'bg-blue-500 hover:bg-blue-600 hover:shadow-lg'
                      : 'cursor-not-allowed bg-gray-400'
                  }`}
                  title={
                    isVoiceEnded
                      ? 'Conversation ended'
                      : voiceDisconnecting
                      ? 'Ending conversation...'
                      : voiceRecording
                      ? 'End voice session'
                      : 'Start speaking'
                  }
                >
                  {isVoiceEnded ? (
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : voiceDisconnecting ? (
                    <svg className="h-8 w-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : voiceSpeaking ? (
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8H4a1 1 0 00-1 1v6a1 1 0 001 1h2.5l4.5 4V4L6.5 8z" />
                    </svg>
                  ) : (
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>

                {/* Back to chat button */}
                {!voiceDisconnecting && !isVoiceEnded && (
                  <button
                    onClick={deactivateVoiceMode}
                    className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                    title="Back to text chat"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="text-center text-sm">
                {isVoiceEnded ? (
                  <span className="font-semibold text-gray-500">Conversation ended</span>
                ) : voiceDisconnecting ? (
                  <span className="font-semibold text-amber-600">Ending conversation…</span>
                ) : voiceConnecting ? (
                  <span className="text-orange-600">Connecting to voice service…</span>
                ) : voiceSpeaking ? (
                  <span className="font-semibold text-indigo-600">Bot is speaking</span>
                ) : voiceRecording ? (
                  <span className="font-semibold text-emerald-600">Speak now</span>
                ) : voiceConnected ? (
                  <span className="text-gray-600">Click the mic to start speaking</span>
                ) : (
                  <span className="text-orange-600">Connecting to voice service…</span>
                )}
              </div>
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
              {isListening ? (
                /* ── Recording state: light pill with waveform + ✕ / ✓ ── */
                <div className="flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-3 py-2 shadow-sm">
                  {/* Mic indicator (pulsing dot) */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                  </span>

                  {/* Waveform */}
                  <div className="h-8 flex-1">
                    <AudioWaveform
                      level={audioLevel}
                      active
                      color="rgba(107, 114, 128, 0.7)"
                      trackColor="rgba(209, 213, 219, 0.45)"
                    />
                  </div>

                  {/* Reject — discard audio buffer */}
                  <button
                    onClick={handleRejectTranscript}
                    type="button"
                    className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-red-100 hover:text-red-500"
                    title="Discard recording"
                  >
                    <i className="fi fi-rr-cross-small flex h-4 w-4 items-center justify-center text-[16px] leading-none" />
                  </button>

                  {/* Accept — commit transcript to input */}
                  <button
                    onClick={handleAcceptTranscript}
                    type="button"
                    className={`inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-linear-to-r ${theme.ctaFrom} ${theme.ctaTo} text-white transition-all hover:opacity-90`}
                    title="Accept transcription"
                  >
                    <i className="fi fi-rr-check flex h-4 w-4 items-center justify-center text-[16px] leading-none" />
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

                  {/* Mic button */}
                  <button
                    onClick={handleMicToggle}
                    disabled={isLoading}
                    type="button"
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
                    title="Start voice input"
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
                  {isListening ? (
                    <span className="text-red-400">Recording… tap ✓ to accept or ✕ to discard.</span>
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
