'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { useToast } from '@/app/_components/Toast';
import { useRouter } from 'next/navigation';
import { sessionManagementApi } from '@/lib/api-services';
import apiClient from '@/lib/api-client';
import {
  ragConversationApi,
  shouldUseRAGSystem,
  getCollegeSelectionIdFromLocalStorage,
  RAGConversationStartResponse,
  RAGConversationMessageResponse,
} from '@/lib/rag-conversation-api';

// Optional: keep your text-polish step if you want (unchanged).
// You can remove polishRAGText and buildPolishPrompt if not needed.
async function callOpenAIChat(
  apiKey: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens = 200,
  temperature = 0.6
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? '';
}

function buildPolishPrompt(
  rawRagText: string,
  opts?: {
    phase?: string;
    essayType?: string;
    essayTopic?: string;
    collegeName?: string;
    studentName?: string;
  }
) {
  const { phase, essayType, essayTopic, collegeName, studentName } = opts || {};
  const name = studentName || 'Student';

  const system = `You are a warm, conversational essay coach having an intimate conversation with ${name}. Transform the RAG-generated text into ONE personal question (25-40 words) that:

❗ CRITICAL RULES:
1. Always start with "Hey ${name}!" or "${name},"
2. Make it feel like you know them personally
3. Reference their essay topic '${essayTopic}' naturally
4. Use a warm, encouraging tone (like a mentor who cares)
5. Ask about their personal experiences, not hypothetical scenarios

CONTEXT:
- Student: ${name}
- Essay Topic: ${essayTopic}
- College: ${collegeName}
- Essay Type: ${essayType}
- Phase: ${phase}

Transform the RAG text into a personal, conversational question. Output ONLY the question.`;

  const user = `RAG Text to Transform:\n"""${rawRagText}"""\n\nMake this personal and conversational for ${name}:`;
  return { system, user };
}

async function polishRAGText(
  rawText: string,
  meta?: {
    phase?: string;
    essayType?: string;
    essayTopic?: string;
    collegeName?: string;
    studentName?: string;
  }
) {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? '';
  if (!apiKey) return rawText;
  try {
    const { system, user } = buildPolishPrompt(rawText, meta);
    const polished = await callOpenAIChat(apiKey, [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);
    return polished || rawText;
  } catch {
    return rawText;
  }
}

// ===================== Realtime (WebRTC) =====================
// Life cycle:
// 1) We create an ephemeral session directly via OpenAI Realtime API
// 2) We create RTCPeerConnection, add microphone track
// 3) We POST the local SDP offer to OpenAI Realtime with the ephemeral token
// 4) We set remote SDP answer; audio from model comes back as a track
// 5) We use the DataChannel to receive transcript text events
// 6) For each transcript, we invoke RAG and then ask Realtime to SPEAK our bot text

interface RealtimeState {
  pc: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  micStream: MediaStream | null;
  connected: boolean;
}

const REALTIME_MODEL = 'gpt-4o-realtime-preview-2024-12-17'; // change if needed
const VOICE_MAP: Record<string, string> = { male: 'cedar', female: 'marin' };

// Event names seen on the OpenAI Realtime data channel commonly include:
// - response.output_text.delta (partial text)
// - response.output_text.done (end of text)
// - response.completed (end of turn)
// We’ll buffer text on *.delta and treat *.done/completed as end-of-utterance.

const RAGEnhancedConversationPage: React.FC = () => {
  const router = useRouter();
  const { addToast } = useToast();

  // Core UI state (same as your existing page)
  type MsgRole = 'bot' | 'user';
  interface Message {
    id: string;
    type: MsgRole;
    content: string;
    timestamp: Date;
    ragQaId?: string;
    ragMetadata?: any;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // RAG/session progress
  const DEFAULT_TOTAL_STEPS = 8;
  const [usingRAGSystem, setUsingRAGSystem] = useState(false);
  const [ragSessionId, setRagSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(DEFAULT_TOTAL_STEPS);
  const [isConversationComplete, setIsConversationComplete] = useState(false);

  // Timer
  const [timer, setTimer] = useState(600); // 10 min as PRD suggests a 10-min timebox

  // Realtime/WebRTC
  const [rt, setRt] = useState<RealtimeState>({
    pc: null,
    dataChannel: null,
    micStream: null,
    connected: false,
  });
  const [voiceReady, setVoiceReady] = useState(false);
  const [realtimeVoice, setRealtimeVoice] = useState('cedar');
  const transcriptBufferRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch voice preference from user settings
  useEffect(() => {
    apiClient<{ settings: { voice_persona?: string } }>('/api/accounts/settings/')
      .then((data) => {
        const persona = data.settings?.voice_persona || 'male';
        setRealtimeVoice(VOICE_MAP[persona] || 'cedar');
      })
      .catch(() => setRealtimeVoice('cedar'));
  }, []);
  useEffect(() => {
    if (isConversationComplete) return;
    const int = setInterval(() => setTimer((t) => (t <= 1 ? 0 : t - 1)), 1000);
    return () => clearInterval(int);
  }, [isConversationComplete]);

  // ---------- Initialization ----------
  useEffect(() => {
    (async () => {
      setIsInitializing(true);
      try {
        const dataConfirmed = localStorage.getItem('brainstorm-data-confirmed');
        if (!dataConfirmed) {
          addToast('Please review and confirm your information first…', {
            type: 'error',
          });
          router.push('/essay-brainstorm/confirmation');
          return;
        }

        const collegeData = JSON.parse(
          localStorage.getItem('college-essay-data') || 'null'
        );
        if (!collegeData) {
          addToast('Missing college and essay information. Redirecting…', {
            type: 'error',
          });
          router.push('/essay-brainstorm/college-selection');
          return;
        }

        const ragAvailable = await shouldUseRAGSystem();
        if (ragAvailable) {
          await startRAGConversation();
          setUsingRAGSystem(true);
        } else {
          await startOpenAIConversationFallback();
          setUsingRAGSystem(false);
        }
      } catch (e) {
        console.error('Init error', e);
        addToast('Failed to start brainstorming. Please refresh.', {
          type: 'error',
        });
      } finally {
        setIsInitializing(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- RAG flow (unchanged logic) ----------
  async function startRAGConversation() {
    const collegeSelectionId = getCollegeSelectionIdFromLocalStorage();
    if (!collegeSelectionId) throw new Error('College selection ID not found');

    const res: RAGConversationStartResponse =
      await ragConversationApi.startConversation({
        college_selection_id: collegeSelectionId,
      });

    setRagSessionId(res.session_id);
    setCurrentStep(res.current_step);
    setTotalSteps(res.total_steps);

    const localCtx = getLocalEssayCtx();
    const firstQ = await polishRAGText(res.first_question, {
      phase: res.phase,
      essayType: res.essay_type,
      essayTopic: res.essay_topic || localCtx?.essayTopic,
      collegeName: localCtx?.collegeName,
      studentName: localCtx?.studentName || 'Student',
    });

    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content: firstQ,
      timestamp: new Date(),
      ragQaId: res.rag_qa_id,
      ragMetadata: { phase: res.phase, essayType: res.essay_type },
    };
    setMessages([botMsg]);

    // If realtime connected, speak the first question via Realtime
    if (rt.connected && rt.dataChannel) speakViaRealtime(firstQ);
  }

  async function handleRAGMessage(userText: string) {
    if (!ragSessionId) return;
    const res: RAGConversationMessageResponse =
      await ragConversationApi.sendMessage({
        session_id: ragSessionId,
        message: userText,
      });

    setCurrentStep(res.current_step);
    setIsConversationComplete(res.is_complete);

    if (res.is_complete && res.final_dataset) {
      localStorage.setItem(
        'rag_conversation_dataset',
        JSON.stringify(res.final_dataset)
      );
      addToast('🎉 Conversation complete! Generating structure…', {
        type: 'success',
      });
      setTimeout(() => navigateToResults(), 800);
      return;
    }

    const localCtx = getLocalEssayCtx();
    const nextQ = await polishRAGText(res.bot_response, {
      phase: res.phase,
      essayType: res.essay_type,
      essayTopic: res.essay_topic || localCtx?.essayTopic,
      collegeName: localCtx?.collegeName,
      studentName: localCtx?.studentName || 'Student',
    });

    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content: nextQ,
      timestamp: new Date(),
      ragQaId: res.rag_qa_id,
      ragMetadata: {
        phase: res.phase,
        essayType: res.essay_type,
        isFallback: res.is_fallback,
      },
    };
    setMessages((prev) => [...prev, botMsg]);

    if (rt.connected && rt.dataChannel) speakViaRealtime(nextQ);
  }

  // ---------- OpenAI-only fallback (text UI) ----------
  async function startOpenAIConversationFallback() {
    const localCtx = getLocalEssayCtx();
    const raw = `Hi! Let's start brainstorming your essay. What's the most meaningful experience you'd like to share?`;
    const first = await polishRAGText(raw, {
      essayTopic: localCtx?.essayTopic,
      collegeName: localCtx?.collegeName,
      studentName: localCtx?.studentName || 'Student',
    });
    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content: first,
      timestamp: new Date(),
    };
    setMessages([botMsg]);
    if (rt.connected && rt.dataChannel) speakViaRealtime(first);
  }

  async function handleOpenAIMessageFallback(_userText: string) {
    const localCtx = getLocalEssayCtx();
    const raw = `Thanks for sharing. Could you expand on how that experience shaped your perspective for this essay?`;
    const nextQ = await polishRAGText(raw, {
      essayTopic: localCtx?.essayTopic,
      collegeName: localCtx?.collegeName,
      studentName: localCtx?.studentName || 'Student',
    });
    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content: nextQ,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMsg]);
    if (rt.connected && rt.dataChannel) speakViaRealtime(nextQ);
  }

  function getLocalEssayCtx() {
    try {
      return JSON.parse(localStorage.getItem('college-essay-data') || 'null');
    } catch {
      return null;
    }
  }

  // ---------- Text input send (UI fallback) ----------
  async function handleSendMessage() {
    if (!currentMessage.trim()) return;
    const userText = currentMessage.trim();
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      if (usingRAGSystem && ragSessionId) await handleRAGMessage(userText);
      else await handleOpenAIMessageFallback(userText);
    } catch (e) {
      console.error(e);
      addToast('Could not process your message. Try again.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }

  // ---------- Navigation ----------
  async function navigateToResults() {
    try {
      localStorage.setItem(
        'essay_brainstorm_transcript',
        JSON.stringify(messages)
      );
      if (usingRAGSystem && ragSessionId) {
        try {
          const datasetResult =
            await ragConversationApi.getConversationDataset(ragSessionId);
          localStorage.setItem(
            'rag_conversation_dataset',
            JSON.stringify(datasetResult.dataset)
          );
        } catch (err) {
          console.warn('Dataset fetch failed', err);
        }
      }
    } finally {
      router.push('/essay-brainstorm/structure');
    }
  }

  // ================== Realtime helpers (WebRTC) ==================
  async function startVoiceSession() {
    if (rt.connected) return; // already on
    try {
      // 1) Create an ephemeral session directly via OpenAI Realtime API
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) throw new Error('Missing OpenAI API key');
      const sessionBody = {
        model: REALTIME_MODEL,
        voice: realtimeVoice,
        modalities: ['audio'],
        instructions:
          'You are a warm, conversational essay coach for students aged 10-22. Engage in natural back-and-forth conversation to help them brainstorm essay ideas. Be personalized, encouraging, and ask follow-up questions that help uncover meaningful stories and insights.',
        turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 500 },
      };
      const tokenRes = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'realtime=v1',
        },
        body: JSON.stringify(sessionBody),
      });
      if (!tokenRes.ok) throw new Error(await tokenRes.text());
      const tokenJson = await tokenRes.json();
      const EPHEMERAL_KEY: string = tokenJson?.client_secret?.value;
      if (!EPHEMERAL_KEY) throw new Error('Missing ephemeral token');

      // 2) Make a peer connection, add mic
      const pc = new RTCPeerConnection();
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach((t) => pc.addTrack(t, mic));

      // 3) Play model audio
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // 4) Data channel for control/events
      const dc = pc.createDataChannel('oai-events');
      dc.onopen = () => setVoiceReady(true);
      dc.onclose = () => setVoiceReady(false);
      dc.onmessage = onRealtimeMessage;

      // 5) Create SDP offer & send to OpenAI Realtime
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      const resp = await fetch(
        `https://api.openai.com/v1/realtime?model=${REALTIME_MODEL}`,
        {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            'Content-Type': 'application/sdp',
            'OpenAI-Beta': 'realtime=v1',
          },
        }
      );
      if (!resp.ok) throw new Error(await resp.text());
      const answer = {
        type: 'answer',
        sdp: await resp.text(),
      } as RTCSessionDescriptionInit;
      await pc.setRemoteDescription(answer);

      setRt({ pc, dataChannel: dc, micStream: mic, connected: true });
      addToast('🎙️ Voice session connected', { type: 'success' });
    } catch (e: any) {
      console.error('startVoiceSession error', e);
      addToast(`Voice connect failed: ${e?.message || e}`, { type: 'error' });
      stopVoiceSession();
    }
  }

  function stopVoiceSession() {
    try {
      rt.dataChannel?.close();
      rt.pc?.close();
      rt.micStream?.getTracks().forEach((t) => t.stop());
    } catch {}
    setRt({ pc: null, dataChannel: null, micStream: null, connected: false });
    setVoiceReady(false);
    addToast('🔇 Voice session stopped', { type: 'info' });
  }

  // Receive messages from Realtime model (we configured session to respond with transcripts only)
  function onRealtimeMessage(ev: MessageEvent<string>) {
    try {
      const msg = JSON.parse(ev.data);
      const type = msg?.type as string;

      // Accumulate transcript text
      if (
        type === 'response.output_text.delta' &&
        typeof msg.delta === 'string'
      ) {
        transcriptBufferRef.current += msg.delta;
      }

      // Some implementations send a *.done event; capture both
      if (
        type === 'response.output_text.done' ||
        type === 'response.completed'
      ) {
        const transcript = transcriptBufferRef.current.trim();
        transcriptBufferRef.current = '';
        if (transcript) void onUserTranscript(transcript);
      }
    } catch {
      // Non-JSON messages can be ignored
    }
  }

  // Called after we get a full transcript from Realtime
  async function onUserTranscript(transcript: string) {
    // Echo the user text in chat
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: transcript,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Route to RAG or fallback
    if (usingRAGSystem && ragSessionId) await handleRAGMessage(transcript);
    else await handleOpenAIMessageFallback(transcript);
  }

  // Ask Realtime to SPEAK a string exactly (best effort)
  function speakViaRealtime(text: string) {
    if (!rt.connected || !rt.dataChannel) return;
    const event = {
      type: 'response.create',
      response: {
        modalities: ['audio'],
        audio: { voice: realtimeVoice },
        // Keep the model from improvising: ask it to read the text verbatim.
        instructions: `Read aloud the following exactly (no extra words): ${JSON.stringify(text)}`,
      },
    };
    rt.dataChannel.send(JSON.stringify(event));
  }

  // ---------- UI helpers ----------
  const answeredCount = usingRAGSystem
    ? currentStep
    : messages.filter((m) => m.type === 'user').length;
  const totalCount = usingRAGSystem ? totalSteps : DEFAULT_TOTAL_STEPS;
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-lg font-semibold">
            Setting up your essay brainstorming session…
          </div>
          <div className="text-sm text-gray-600">
            {usingRAGSystem
              ? 'Loading enhanced RAG system…'
              : 'Loading conversation system…'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Heading
                level={2}
                className="text-xl font-semibold text-gray-900"
              >
                📝 Essay Brainstorming Session
                {usingRAGSystem && (
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                    Enhanced RAG
                  </span>
                )}
              </Heading>
              <Paragraph className="mt-1 text-sm text-gray-600">
                {answeredCount}/{totalCount} questions answered
              </Paragraph>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-mono text-lg text-gray-900">
                  {formatTime(timer)} mins
                </span>
              </div>
              {!rt.connected ? (
                <button
                  onClick={startVoiceSession}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-white transition hover:bg-blue-700"
                >
                  Start Voice
                </button>
              ) : (
                <button
                  onClick={stopVoiceSession}
                  className="rounded-lg bg-gray-200 px-3 py-2 text-gray-900 transition hover:bg-gray-300"
                >
                  Stop Voice
                </button>
              )}
              {rt.connected && (
                <span
                  className={`rounded px-2 py-1 text-xs ${voiceReady ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                >
                  {voiceReady ? 'Voice live' : 'Connecting…'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl ${m.type === 'user' ? 'text-right' : 'text-left'}`}
              >
                {m.type === 'bot' && (
                  <div className="mb-2 flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                      <svg
                        className="h-4 w-4 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <span className="flex items-center space-x-1 text-sm text-gray-500">
                      <span>
                        Essay Coach {usingRAGSystem ? '(Enhanced)' : ''}
                      </span>
                      {rt.connected && (
                        <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                          Voice
                        </span>
                      )}
                    </span>
                  </div>
                )}
                <div
                  className={[
                    'rounded-lg px-4 py-3',
                    m.type === 'user'
                      ? 'ml-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'border bg-white text-gray-900 shadow-sm',
                  ].join(' ')}
                >
                  <Paragraph
                    className={`${m.type === 'user' ? 'text-white' : 'text-gray-900'} leading-relaxed`}
                  >
                    {m.content}
                  </Paragraph>
                </div>
                <div className="mt-1 mr-1 text-xs text-gray-500">
                  {m.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-3xl">
                <div className="mb-2 flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                    <svg
                      className="h-4 w-4 animate-pulse text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500">
                    Analyzing your response…
                  </span>
                </div>
                <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400"></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Text input fallback (kept for accessibility) */}
        <div className="border-t bg-white px-6 py-4">
          {isConversationComplete ? (
            <div className="py-4 text-center">
              <div className="mb-2 text-lg font-semibold text-green-600">
                🎉 Conversation Complete!
              </div>
              <div className="mb-4 text-sm text-gray-600">
                We’ve saved your responses. Head over to structure generation.
              </div>
              <button
                onClick={navigateToResults}
                className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder={
                    rt.connected
                      ? 'Speak to answer (or type here)…'
                      : 'Type your response… (Shift+Enter = newline)'
                  }
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RAGEnhancedConversationPage;
