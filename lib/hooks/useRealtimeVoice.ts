/**
 * React Hook for Realtime Voice Conversations
 *
 * Generic hook that works for any feature (Stream & Subject Selection, Career & Degree Selection , …)
 * by accepting a WebSocket path. Exposes connect / disconnect so the page can
 * start a voice session on-demand.
 */
import { useState, useRef, useCallback } from 'react';
import { RealtimeVoiceClient, type RealtimeTokenUsage, type SessionProgress } from '@/lib/realtime-voice-client';

interface UseRealtimeVoiceOptions {
  sessionId: string;
  /** Feature identifier, e.g. 'domain-discovery' or 'career-discovery' */
  feature: string;
  /** Label for console logs (default: 'Realtime') */
  label?: string;
  /** OpenAI Realtime voice name (e.g. 'cedar', 'marin') */
  voice?: string;
  /** OpenAI Realtime voice accent (e.g. 'indian', 'british', 'american') */
  accent?: string;
  /** Conversation language setting (e.g. 'en', 'hi') */
  language?: string;
  onError?: (error: string) => void;
  /** Called when the backend sends updated session progress */
  onSessionProgress?: (progress: SessionProgress) => void;
}

export interface RealtimeVoiceMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useRealtimeVoice({ sessionId, feature, label, voice, accent, language, onError, onSessionProgress }: UseRealtimeVoiceOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [highlightLastBot, setHighlightLastBot] = useState(false);
  const [transcript, setTranscript] = useState<RealtimeVoiceMessage[]>([]);
  const [realtimeTokenUsage, setRealtimeTokenUsage] = useState<RealtimeTokenUsage | null>(null);

  const clientRef = useRef<RealtimeVoiceClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const onErrorRef = useRef(onError);
  const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMutedRef = useRef(false);
  const onSessionProgressRef = useRef(onSessionProgress);
  const audioLevelRef = useRef(0);
  const isConnectingRef = useRef(false);
  // Batched transcript: accumulate updates in a ref, flush via rAF to avoid
  // exceeding React's nested-update limit during rapid streaming deltas.
  const transcriptRef = useRef<RealtimeVoiceMessage[]>([]);
  const transcriptRafRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  // Track if the current user bubble was created by the local speech recognition
  const isLocalTranscriptActiveRef = useRef(false);

  onErrorRef.current = onError;
  onSessionProgressRef.current = onSessionProgress;



  // Flush batched transcript updates to React state (coalesces rapid deltas)
  const scheduleTranscriptFlush = useCallback(() => {
    if (transcriptRafRef.current !== null) return;
    transcriptRafRef.current = requestAnimationFrame(() => {
      transcriptRafRef.current = null;
      setTranscript([...transcriptRef.current]);
    });
  }, []);

  const updateTranscriptRef = useCallback((updater: (prev: RealtimeVoiceMessage[]) => RealtimeVoiceMessage[]) => {
    transcriptRef.current = updater(transcriptRef.current);
    setTranscript([...transcriptRef.current]);
  }, []);

  // ─── helpers ──────────────────────────────────────────────

  const teardownMic = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped or not started
      }
      recognitionRef.current = null;
    }
    isLocalTranscriptActiveRef.current = false;

    if (workletNodeRef.current) { workletNodeRef.current.disconnect(); workletNodeRef.current = null; }
    if (sourceNodeRef.current) { sourceNodeRef.current.disconnect(); sourceNodeRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach((t) => t.stop()); audioStreamRef.current = null; }
    if (transcriptRafRef.current !== null) { cancelAnimationFrame(transcriptRafRef.current); transcriptRafRef.current = null; }
    setIsRecording(false);
    audioLevelRef.current = 0;
  }, []);

  const openMic = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 24000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    audioStreamRef.current = stream;

    const ctx = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = ctx;

    await ctx.audioWorklet.addModule('/audio/pcm-processor.js');

    const source = ctx.createMediaStreamSource(stream);
    sourceNodeRef.current = source;

    const worklet = new AudioWorkletNode(ctx, 'pcm-processor');
    workletNodeRef.current = worklet;

    worklet.port.onmessage = (e: MessageEvent<{ pcm16: ArrayBuffer; rms: number }>) => {
      if (isMutedRef.current) { audioLevelRef.current = 0; return; }
      audioLevelRef.current = e.data.rms;
      clientRef.current?.sendAudio(e.data.pcm16);
    };

    source.connect(worklet);
    // AudioWorkletNode doesn't need to connect to destination for capture,
    // but some browsers require a connected graph to keep processing alive.
    worklet.connect(ctx.destination);
    setIsRecording(true);

    // Initialize Web Speech API for live transcription preview
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : (accent === 'british' ? 'en-GB' : 'en-US');
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            // Final results from browser are less accurate than OpenAI's
            // so we only use interim results for the live preview.
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (interimTranscript.trim()) {
          updateTranscriptRef((prev) => {
            // Find the most recent user message bubble (could be an ellipsis placeholder or a previous draft)
            const lastUserIdx = [...prev].reverse().findIndex(m => m.role === 'user');
            if (lastUserIdx !== -1) {
              const actualIdx = prev.length - 1 - lastUserIdx;
              const updated = [...prev];
              updated[actualIdx] = { ...updated[actualIdx], content: interimTranscript };
              isLocalTranscriptActiveRef.current = true;
              return updated;
            }
            
            // If no user bubble exists yet, create one
            isLocalTranscriptActiveRef.current = true;
            return [...prev, { role: 'user', content: interimTranscript, timestamp: new Date() }];
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error('[Voice] Speech recognition error:', event.error);
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.error('[Voice] Failed to start speech recognition:', e);
      }
    }

    console.log('[Voice] Microphone opened and worklet connected');
  }, [language, accent, updateTranscriptRef]);

  // ─── public API ───────────────────────────────────────────

  const connectVoice = useCallback(
    async (chatHistory: { role: 'user' | 'assistant'; content: string }[], lastBotMessage?: string, isNewSession?: boolean, resuming?: boolean) => {
      if (clientRef.current || isConnectingRef.current) return;
      isConnectingRef.current = true;
      setIsConnecting(true);

      // Clear any stale transcript from a previous voice session so the
      // sync effect doesn't re-add old entries to the messages list.
      transcriptRef.current = [];
      setTranscript([]);

      try {
        const client = new RealtimeVoiceClient({
          sessionId,
          feature,
          label,
          voice,
          accent,
          language,
          onConnected: () => {
            isConnectingRef.current = false;
            setIsConnected(true);
            setIsConnecting(false);
          },
          onDisconnected: () => {
            setIsConnected(false);
            setIsRecording(false);
          },
          onError: (error) => {
            console.error('[Voice] Realtime voice error:', error);
            // Full cleanup: tear down mic + disconnect WS so nothing is left dangling
            teardownMic();
            if (clientRef.current) {
              clientRef.current.disconnect();
              clientRef.current = null;
            }
            onErrorRef.current?.(error);
            isConnectingRef.current = false;
            setIsConnected(false);
            setIsConnecting(false);
          },
          onTranscriptUpdate: (text, role, isNewTurn) => {
            if (role === 'user') {
              // Once OpenAI sends a user transcript (delta or completed), 
              // we stop the local preview from being the "active" bubble.
              isLocalTranscriptActiveRef.current = false;
            }

            updateTranscriptRef((prev) => {
              const last = prev[prev.length - 1];

              // Assistant streaming delta — append to the current entry
              if (last && last.role === 'assistant' && role === 'assistant' && !isNewTurn) {
                return [...prev.slice(0, -1), { ...last, content: last.content + text }];
              }

              // User transcription completing a placeholder that was created
              // by conversation.item.created (isNewTurn=false for user means
              // "replace the most recent user entry").  The placeholder may
              // no longer be the last entry because assistant deltas can
              // arrive in between, so walk backwards to find it.
              if (role === 'user' && !isNewTurn) {
                for (let i = prev.length - 1; i >= 0; i--) {
                  if (prev[i].role === 'user') {
                    const updated = [...prev];
                    updated[i] = { ...updated[i], content: text };
                    return updated;
                  }
                }
                // Fallback: no placeholder found, create a new entry
              }

              // New turn — create a new transcript entry
              return [...prev, { role, content: text, timestamp: new Date() }];
            });
          },
          onAudioResponse: () => {
            // Each audio delta still triggers this callback, but muting and
            // isSpeaking are now controlled by playback start/finish below.
          },
          onPlaybackStarted: () => {
            // Bot audio is now playing through the speaker — mute the mic
            // so user speech doesn't get picked up and sent to the API.
            isMutedRef.current = true;
            setIsSpeaking(true);
            // Clear any pending user audio in the API buffer so stale
            // speech captured before the bot started talking isn't processed.
            clientRef.current?.clearAudioBuffer();
            if (speakingTimeoutRef.current) {
              clearTimeout(speakingTimeoutRef.current);
              speakingTimeoutRef.current = null;
            }
          },
          onPlaybackFinished: () => {
            // All queued audio has finished playing — unmute the mic.
            setIsSpeaking(false);
            isMutedRef.current = false;
          },
          onTokenUsage: (usage) => {
            setRealtimeTokenUsage(usage);
          },
          onSessionProgress: (progress) => {
            onSessionProgressRef.current?.(progress);
          },
          onDisplayContent: (content) => {
            // Insert formatted content (e.g. markdown table from a tool call)
            // as a completed assistant transcript entry.
            updateTranscriptRef((prev) => [
              ...prev,
              { role: 'assistant', content, timestamp: new Date() },
            ]);
          },
          onHighlightLastBot: (highlight) => {
            setHighlightLastBot(highlight);
          },
        });

        clientRef.current = client;
        await client.connect();

        // Wait a small moment for session.created before seeding context
        await new Promise((r) => setTimeout(r, 500));

        if (chatHistory.length > 0) client.seedConversationHistory(chatHistory);
        if (isNewSession && lastBotMessage) {
          client.announceIntro(lastBotMessage);
        } else if (resuming && lastBotMessage) {
          client.promptResume(lastBotMessage);
        } else if (lastBotMessage) {
          client.promptContinuation(lastBotMessage);
        }

        // Pre-mute the mic if the bot is about to speak (intro or
        // continuation) so no gibberish gets captured before it finishes.
        // onPlaybackFinished will unmute once the bot is done speaking.
        if (lastBotMessage) {
          isMutedRef.current = true;
        }

        await openMic();
      } catch (err) {
        console.error('Failed to connect voice:', err);
        onErrorRef.current?.('Failed to connect to voice service');
        isConnectingRef.current = false;
        setIsConnecting(false);
        clientRef.current = null;
      }
    },
    [sessionId, feature, label, voice, accent, language, openMic, teardownMic, updateTranscriptRef],
  );

  const disconnectVoice = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    console.log(`[Voice] disconnectVoice called (silent=${silent})`);
    setIsDisconnecting(true);
    teardownMic();
    if (speakingTimeoutRef.current) { clearTimeout(speakingTimeoutRef.current); speakingTimeoutRef.current = null; }
    if (clientRef.current) {
      clientRef.current.clearAudioBuffer();
      if (!silent) {
        try {
          // Ask the AI to acknowledge the switch to text and wait for it to finish
          // (sendSwitchToText waits for both response.done + audio playback)
          await clientRef.current.sendSwitchToText();
          console.log('[Voice] sendSwitchToText completed');
        } catch (err) {
          console.error('[Voice] sendSwitchToText failed:', err);
        }
      }
      // Now safe to tear down the connection and audio pipeline
      const client = clientRef.current;
      if (client) {
        client.disconnect();
        console.log('[Voice] Client disconnected successfully');
      }
      clientRef.current = null;
    } else {
      console.log('[Voice] No client to disconnect — already cleaned up');
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setIsRecording(false);
    setIsDisconnecting(false);
    // Clear transcript so stale entries aren't re-synced if voice mode
    // is re-activated later.
    transcriptRef.current = [];
    setTranscript([]);
  }, [teardownMic]);

  const startRecording = useCallback(async () => {
    if (!clientRef.current || !isConnected) { console.warn('Cannot start recording: client not connected'); return; }
    try { await openMic(); } catch (error) { console.error('Error starting recording:', error); onErrorRef.current?.('Failed to access microphone'); }
  }, [isConnected, openMic]);

  const stopRecording = useCallback(() => {
    // Clear (don't commit) the buffer — server VAD auto-commits on detected
    // speech.  Committing an empty/tiny buffer triggers "buffer too small".
    if (clientRef.current) clientRef.current.clearAudioBuffer();
    teardownMic();
  }, [teardownMic]);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording(); else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const sendText = useCallback((text: string) => {
    if (clientRef.current && isConnected) clientRef.current.sendText(text);
  }, [isConnected]);

  const stopAudio = useCallback(() => {
    if (clientRef.current) { clientRef.current.stopAudio(); setIsSpeaking(false); isMutedRef.current = false; }
  }, []);

  return {
    isConnected, isConnecting, isRecording, isSpeaking, isDisconnecting, highlightLastBot, transcript, realtimeTokenUsage, audioLevelRef,
    connectVoice, disconnectVoice, startRecording, stopRecording, toggleRecording, sendText, stopAudio,
  };
}
