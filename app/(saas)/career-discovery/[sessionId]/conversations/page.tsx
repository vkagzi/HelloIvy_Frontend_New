'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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

type Role = 'bot' | 'user';

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
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // STT - MediaRecorder + Backend Whisper
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

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
            const sessionResp = await careerDiscoveryApi.getCurrentSession();
            if (sessionResp) {
              if (sessionResp.created_at) {
                setSessionCreatedAt(sessionResp.created_at);
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

  // Timer effect - updates every second
  useEffect(() => {
    if (!sessionCreatedAt) return;

    const updateTimer = (): void => {
      const createdTime = new Date(sessionCreatedAt).getTime();
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - createdTime) / 1000);

      // 30 minutes + 5 seconds grace = 1805 seconds
      const totalSeconds = 30 * 60 + 5;
      const remaining = Math.max(0, totalSeconds - elapsedSeconds);

      setTimeRemaining(remaining);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [sessionCreatedAt]);

  // Format time remaining as MM:SS
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  async function handleSend(): Promise<void> {
    if (!input.trim() || isLoading || !sessionId) return;

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

  // STT functions - using backend Whisper API
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    setIsTranscribing(true);
    console.error('🔄 Starting transcription via backend...');

    try {
      const transcription = await careerDiscoveryApi.transcribeAudio(audioBlob);
      console.error('✅ Transcription result:', transcription);
      return transcription || '';
    } catch (error) {
      console.error('❌ Transcription error:', error);
      addToast(`Voice transcription failed: ${error}`, { type: 'error' });
      return '';
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async (): Promise<void> => {
    try {
      console.error('🎤 Starting microphone detection...');

      // Check browser support first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'getUserMedia not supported in this browser. Please use Chrome, Firefox, or Safari.'
        );
      }

      // First, enumerate devices to see what's available
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(
          (device) => device.kind === 'audioinput'
        );
        console.error('🎤 Available audio devices:', audioInputs.length);

        audioInputs.forEach((device, index) => {
          console.error(`Device ${index + 1}:`, {
            deviceId: device.deviceId,
            label: device.label || 'Unknown Microphone',
            groupId: device.groupId,
          });
        });

        if (audioInputs.length === 0) {
          throw new Error(
            'No microphone devices found. Please connect a microphone and refresh the page.'
          );
        }
      } catch {
        // Could not enumerate devices, continue anyway
        // Let getUserMedia handle it
      }

      // Try multiple constraint configurations
      const constraintOptions = [
        // Most permissive - let browser choose any available microphone
        { audio: true },
        // More specific but still flexible
        {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        },
        // Minimal constraints
        {
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        },
      ];

      let stream = null;
      let lastError = null;

      for (let i = 0; i < constraintOptions.length; i++) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(
            constraintOptions[i]
          );
          break;
        } catch (error) {
          lastError = error;
          continue;
        }
      }

      if (!stream) {
        throw lastError || new Error('All microphone access attempts failed');
      }

      // Check if the stream has active audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('No audio tracks found in the stream');
      }

      // Create MediaRecorder with explicit MIME type support check
      let recorder;
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ];

      let selectedType = 'audio/webm'; // fallback
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedType = type;
          break;
        }
      }

      try {
        recorder = new MediaRecorder(stream, { mimeType: selectedType });
      } catch {
        // Failed to create with MIME type, use default
        recorder = new MediaRecorder(stream);
      }

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: selectedType });

        if (audioBlob.size > 0) {
          const transcription = await transcribeAudio(audioBlob);
          if (transcription) {
            setInput(transcription);
            if (transcription.trim()) {
              addToast('✅ Speech transcribed successfully!', {
                type: 'success',
              });
            }
          }
        } else {
          addToast('❌ No audio recorded', { type: 'error' });
        }

        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.onerror = (event: Event) => {
        const errorEvent = event as ErrorEvent;
        console.error('MediaRecorder error:', errorEvent.error);
        addToast(`Recording error: ${errorEvent.error}`, { type: 'error' });
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      addToast('🎤 Recording... speak now!', { type: 'info' });
      console.error('📹 Recording started successfully');
    } catch (error) {
      console.error('❌ Complete recording setup failed:', error);
      const err = error as Error & { name?: string };

      if (err.name === 'NotAllowedError') {
        addToast(
          '❌ Microphone access denied. Please click the microphone icon in your browser address bar and allow access.',
          { type: 'error' }
        );
      } else if (err.name === 'NotFoundError') {
        addToast(
          '❌ No microphone found. Please connect a microphone and try again.',
          { type: 'error' }
        );
      } else if (err.name === 'NotSupportedError') {
        addToast(
          '❌ Microphone not supported in this browser. Please use Chrome, Firefox, or Safari.',
          { type: 'error' }
        );
      } else if (err.name === 'NotReadableError') {
        addToast(
          '❌ Microphone is being used by another application. Please close other apps using the microphone.',
          { type: 'error' }
        );
      } else {
        addToast(`❌ Microphone error: ${err.message}`, { type: 'error' });
      }
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const toggleRecording = (): void => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  };

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
        <div className="border-b bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Heading
                  level={2}
                  className="text-xl font-semibold text-gray-900"
                >
                  🚀 Career Discovery Journey
                </Heading>
                {sessionCreatedAt && (
                  <div
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${
                      timeRemaining <= 60
                        ? 'border-red-300 bg-red-50'
                        : timeRemaining <= 300
                          ? 'border-orange-300 bg-orange-50'
                          : 'border-purple-300 bg-purple-50'
                    }`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span
                      className={`text-sm font-semibold ${
                        timeRemaining <= 60
                          ? 'text-red-700'
                          : timeRemaining <= 300
                            ? 'text-orange-700'
                            : 'text-purple-700'
                      }`}
                    >
                      {formatTimeRemaining(timeRemaining)}
                    </span>
                  </div>
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
                Question {questionsCompleted}/{totalQuestions}
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
                      You&apos;ve completed all {totalQuestions} questions.
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
                    placeholder="Type your response…"
                    className="min-h-10! py-2!"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex space-x-2">
                  {/* STT: Voice recording */}
                  <Button
                    variant="icon-outline"
                    onClick={toggleRecording}
                    disabled={isLoading || isTranscribing}
                    className={`px-3 py-2 transition-colors ${
                      isRecording
                        ? 'border-red-300 bg-red-100 text-red-700'
                        : ''
                    }`}
                    title={isRecording ? 'Stop recording' : 'Start voice input'}
                  >
                    {isRecording ? (
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
                        <span className="text-xs">🎤</span>
                      </div>
                    ) : isTranscribing ? (
                      <div className="flex items-center space-x-1">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
                        <span className="text-xs">⏳</span>
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
              <div className="mt-2 text-xs text-gray-500">
                Tip: Press <span className="font-semibold">Enter</span> to send,{' '}
                <span className="font-semibold">Shift+Enter</span> for a new
                line. {isRecording && '🎤 Recording...'}{' '}
                {isTranscribing && '⏳ Processing speech...'}
              </div>
            </>
          )}
        </div>
      </div>

      {sessionId && (
        <CareerDebugDialog
          open={showDebugDialog}
          onOpenChange={setShowDebugDialog}
          sessionId={sessionId}
        />
      )}
    </div>
  );
};

export default CareerConversationPage;
