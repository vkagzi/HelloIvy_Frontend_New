'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { useToast } from '@/app/_components/Toast';
import { Textarea } from '@/components/ui/textarea';
import {
  domainDiscoveryApi,
  SendMessageResponse,
} from '@/lib/domain-discovery-api';
import { marked } from 'marked';
import { Button } from '@/components/ui/button';
import { DomainDebugDialog } from '@/components/DomainDebugDialog';
import { useRealtimeVoice } from '@/lib/hooks/useRealtimeVoice';
import SessionTimer from '@/app/(saas)/_components/SessionTimer';

type Role = 'bot' | 'user';
type QuestionType = 'riasec' | 'deepdive' | 'general';
type ConversationMode = 'chat' | 'voice';

interface Message {
  id: string;
  type: Role;
  content: string;
  question_type?: QuestionType;
  choices?: string[];  // For initial assessment questions
  timestamp: string; // ISO
}

/** ================== Transcript Helpers ================== */
function loadTranscript(sessionId: string): Message[] {
  try {
    const raw = localStorage.getItem(`domain_conversation_transcript_${sessionId}`);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveTranscript(sessionId: string, messages: Message[]) {
  try {
    localStorage.setItem(
      `domain_conversation_transcript_${sessionId}`,
      JSON.stringify(messages)
    );
  } catch {
    /* ignore */
  }
}

const DomainConversationPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string | undefined;
  const { addToast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
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
      // New transcript entries — add corresponding messages
      const newEntries = voiceTranscript.slice(prevVoiceTranscriptLenRef.current);
      const newMessages: Message[] = newEntries.map((t, idx) => ({
        id: `voice-${Date.now()}-${prevVoiceTranscriptLenRef.current + idx}`,
        type: t.role === 'assistant' ? 'bot' : 'user',
        content: t.content,
        question_type: 'deepdive',
        timestamp: t.timestamp.toISOString(),
      }));
      setMessages((prev) => [...prev, ...newMessages]);
      prevVoiceTranscriptLenRef.current = voiceTranscript.length;
    } else {
      // Existing entry content updated (streaming delta) — update the last voice message
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
    // Build conversation history from chat messages
    const chatHistory = messages.map((m) => ({
      role: (m.type === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    }));

    // Find last bot message
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

  const canEndConversation = sessionEnded;

  // Initialize session on mount
  useEffect(() => {
    if (sessionId) {
      initializeSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function initializeSession() {
    if (!sessionId) {
      router.push('/domain-discovery');
      return;
    }
    
      try {
      setIsLoading(true);

      // Try to load existing session messages and also fetch session details for totals
      try {
        const historyResponse = await domainDiscoveryApi.getMessages(sessionId);
        if (historyResponse.messages.length > 0) {
          // Set counts from message history as a fallback
          const rq = historyResponse.riasec_completed ?? 0;
          const dq = historyResponse.deepdive_completed ?? 0;
          setQuestionsCompleted(rq + dq);

          // Try to get authoritative totals from the session endpoint
          try {
            const sessionResp = await domainDiscoveryApi.getSession(sessionId);
            if (sessionResp) {
              // Store the session creation time for timer
              if (sessionResp.created_at) {
                setSessionCreatedAt(sessionResp.created_at);
              }

              // Restore pause state from metadata
              if (sessionResp.metadata) {
                const meta = sessionResp.metadata as Record<string, unknown>;
                if (meta.is_paused) setIsPaused(true);
                if (typeof meta.total_paused_seconds === 'number') setTotalPausedSeconds(meta.total_paused_seconds);
              }

              const rqCompleted = sessionResp.riasec_completed ?? rq;
              const dqCompleted = sessionResp.deepdive_completed ?? dq;
              setQuestionsCompleted(rqCompleted + dqCompleted);

              // Check if conversation was already completed
              if (sessionResp.is_completed) {
                setSessionEnded(true);
                setProgressPercentage(100);
              } else {
                setProgressPercentage(sessionResp.current_step ? Math.min(sessionResp.current_step * 10, 90) : 0);
              }
            }
          } catch (e) {
            // Session may have ended - check if it's because session is complete
            const error = e as { message?: string };
            if (error.message?.includes('No active domain discovery session found')) {
              // Session has ended - mark it as complete
              setSessionEnded(true);
              setProgressPercentage(100);
              console.log('Session has ended. Showing results view.');
            }
            // Continue with historyResponse fallback values
          }

          const loadedMessages: Message[] = historyResponse.messages.map((m) => ({
            id: m.message_id,
            type: m.type,
            content: m.content,
            question_type: m.question_type,
            choices: m.choices,
            timestamp: m.timestamp,
          }));
          setMessages(loadedMessages);
          saveTranscript(sessionId!, loadedMessages);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.log('Could not restore session, redirecting to domain page');
        addToast('Session not found. Please start a new session.', { type: 'error' });
        router.push('/domain-discovery');
        return;
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      addToast('Failed to load conversation. Please try again.', {
        type: 'error',
      });
      router.push('/domain-discovery');
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
  const handleTogglePause = async () => {
    if (!sessionId || pauseLoading || sessionEnded) return;
    setPauseLoading(true);
    try {
      const resp = await domainDiscoveryApi.togglePause(sessionId);
      setIsPaused(resp.is_paused);
      setTotalPausedSeconds(resp.total_paused_seconds);
    } catch (error) {
      console.error('Failed to toggle pause:', error);
      addToast('Failed to pause/resume session.', { type: 'error' });
    } finally {
      setPauseLoading(false);
    }
  };

  async function handleSend() {
    if (!input.trim() || isLoading || !sessionId) return;
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
      const response: SendMessageResponse = await domainDiscoveryApi.sendMessage(
        sessionId,
        userMessage
      );

      // Update progress tracking
      setProgressPercentage(response.progress_percentage);
      setQuestionsCompleted(response.questions_completed);

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
        // Mark session as ended so View Results button appears
        setSessionEnded(true);
        setProgressPercentage(100);
        return;
      }

      // Add bot response with question type and choices
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: response.bot_response,
        question_type: response.question_type,
        choices: response.choices,
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

  // Handle initial assessment option selection
  async function handleOptionSelect(choice: string) {
    if (isLoading || !sessionId) return;
    if (isPaused) {
      addToast('Cannot send message while session is paused. Please resume first.', { type: 'warning' });
      return;
    }
    
    // Treat it like sending a text message
    const userMessage = choice;

    // Add user message to UI immediately
    const studentMsg: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, studentMsg]);
    setIsLoading(true);

    try {
      // Send message to backend and get AI response
      const response: SendMessageResponse = await domainDiscoveryApi.sendMessage(
        sessionId,
        userMessage
      );

      // Update progress tracking
      setProgressPercentage(response.progress_percentage);
      setQuestionsCompleted(response.questions_completed);

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
        // Mark session as ended so View Results button appears
        setSessionEnded(true);
        setProgressPercentage(100);
        return;
      }

      // Add bot response with question type and choices
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: response.bot_response,
        question_type: response.question_type,
        choices: response.choices,
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
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleEnd() {
    if (sessionEnded) {
      // Session concluded by backend - go to results
      await handleViewResults();
      return;
    }
    // Session still in progress - show exit confirmation
    setShowExitDialog(true);
  }

  async function handleViewResults() {
    if (!sessionId) return;
    router.push(`/domain-discovery/${sessionId}/results`);
  }

  function handleConfirmExit() {
    setShowExitDialog(false);
    addToast('Exiting without generating results', { type: 'info' });
    router.push('/domain-discovery');
  }

  function handleCancelExit() {
    setShowExitDialog(false);
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
    <div className="flex h-[calc(100vh-6rem)] min-h-0 bg-linear-to-br from-teal-50 to-cyan-100">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Heading
                  level={2}
                  className="text-xl font-semibold text-gray-900"
                >
                  🧭 Domain Discovery Journey
                </Heading>
                {sessionCreatedAt && (
                  <SessionTimer
                    sessionCreatedAt={sessionCreatedAt}
                    isPaused={isPaused}
                    totalPausedSeconds={totalPausedSeconds}
                    pauseLoading={pauseLoading}
                    sessionEnded={sessionEnded}
                    onTogglePause={handleTogglePause}
                    accentColor="teal"
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
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span>Debug</span>
                </button>
              </div>
              <Paragraph className="mt-1 text-sm text-gray-600">
                Question {questionsCompleted}
              </Paragraph>
              
              {/* Progress Bar */}
              <div className="mt-3 w-full">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-linear-to-r from-teal-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>


            </div>
            <button
              onClick={sessionEnded ? handleViewResults : handleEnd}
              disabled={!canEndConversation}
              title={
                !canEndConversation
                  ? 'Complete all questions to view results'
                  : 'End conversation and get results'
              }
              className={`ml-4 whitespace-nowrap rounded-lg px-4 py-2 text-white ${
                canEndConversation
                  ? 'cursor-pointer bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'
                  : 'cursor-not-allowed bg-gray-400 opacity-60'
              }`}
            >
              View Results →
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 min-h-0 space-y-6 overflow-y-auto px-6 py-4">
          {messages.map((m, index) => {
            const isLatestBotMessage = m.type === 'bot' && index === messages.length - 1;
            const isInitialQuestion = m.question_type === 'riasec' && m.choices && m.choices.length > 0;
            
            return (
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
                        ? 'ml-12 bg-linear-to-r from-teal-500 to-cyan-500 text-white'
                        : 'border bg-white text-gray-900 shadow-sm'
                    } `}
                  >
                    {m.type === 'user' ? (
                      <Paragraph className="text-white">
                        {m.content}
                      </Paragraph>
                    ) : (
                      <div
                        className="prose prose-sm max-w-none text-gray-900 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-2 [&_p]:mt-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-6"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                      />
                    )}
                  </div>
                  
                  {/* Initial Assessment Choice Buttons - show only on latest bot message if it's an initial question */}
                  {m.type === 'bot' && isLatestBotMessage && isInitialQuestion && !isLoading && (
                    <div className="mt-3 flex gap-3">
                      {m.choices!.map((choice, idx) => (
                        <Button
                          key={idx}
                          onClick={() => handleOptionSelect(choice)}
                          className="rounded-lg border-2 border-teal-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-all hover:border-teal-500 hover:bg-teal-50 hover:shadow-md"
                        >
                          {choice}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <div
                    className={`mt-1 text-xs ${m.type === 'user' ? 'text-teal-100' : 'text-gray-500'}`}
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

          {isLoading && !sessionEnded && (
            <div className="flex justify-start">
              <div className="max-w-3xl">
                <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
                  <span className="text-sm text-gray-500">
                    Domain AI is thinking…
                  </span>
                </div>
              </div>
            </div>
          )}

          {sessionEnded && (
            <div className="flex justify-center">
              <div className="max-w-3xl">
                <div className="rounded-lg border-2 border-green-300 bg-green-50 px-6 py-4 text-center shadow-sm">
                  <p className="mb-4 text-sm font-semibold text-green-900">
                    🎉 Conversation complete!
                  </p>
                  <p className="mb-4 text-sm text-green-800">
                    Click below to generate your personalized domain recommendations.
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
              ✅ This session has ended. Click "View Your Results" above to see your domain recommendations.
            </div>
          ) : (() => {
            // Show "thinking" message when loading
            if (isLoading) {
              return (
                <div className="text-center text-sm text-gray-600">
                  ⏳ 
                </div>
              );
            }
            
            const latestBotMessage = messages.filter(m => m.type === 'bot').slice(-1)[0];
            const isInitialQuestion = latestBotMessage?.question_type === 'riasec' && latestBotMessage?.choices && latestBotMessage.choices.length > 0;

            if (isInitialQuestion) {
              return (
                <div className="text-center text-sm text-gray-600">
                  👆 Please select one of the options above to continue
                </div>
              );
            }
            
            return (
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
                            ? 'bg-blue-500 hover:bg-blue-600 hover:shadow-lg'
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
                        <p className="text-sm font-semibold text-blue-600">
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
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-teal-500 border-t-transparent"></div>
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
                      <button
                        onClick={handleEnd}
                        disabled={!canEndConversation}
                        title={
                          !canEndConversation
                            ? 'Complete all questions to view results'
                            : 'End conversation and get results'
                        }
                        className={`whitespace-nowrap rounded-lg px-4 py-2 text-white ${
                          canEndConversation
                            ? 'bg-linear-to-r cursor-pointer from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'
                            : 'cursor-not-allowed bg-gray-400 opacity-60'
                        }`}
                      >
                        End →
                      </button>
                    </div>
                  </div>
                )}
                {conversationMode === 'chat' && (
                  <div className="mt-2 text-xs text-gray-500">
                    Tip: Press <span className="font-semibold">Enter</span> to send,{' '}
                    <span className="font-semibold">Shift+Enter</span> for a new line.
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Domain Discovery Not Complete
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Your conversation is still in progress. 
                The AI coach will wrap up when it has enough information about your interests.
              </p>
              <p className="mt-2 text-sm font-medium text-gray-700">
                Are you sure you want to exit without getting your results?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelExit}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Continue Session
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Exit Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Dialog */}
      {sessionId && (
        <DomainDebugDialog
          open={showDebugDialog}
          onOpenChange={setShowDebugDialog}
          sessionId={sessionId}
        />
      )}
    </div>
  );
};

export default DomainConversationPage;
