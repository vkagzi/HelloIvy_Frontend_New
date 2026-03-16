/**
 * React Hook for Realtime Voice Conversations
 *
 * Generic hook that works for any feature (domain discovery, career discovery, …)
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
  onError?: (error: string) => void;
  /** Called when the backend sends updated session progress */
  onSessionProgress?: (progress: SessionProgress) => void;
}

export interface RealtimeVoiceMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useRealtimeVoice({ sessionId, feature, label, voice, onError, onSessionProgress }: UseRealtimeVoiceOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [transcript, setTranscript] = useState<RealtimeVoiceMessage[]>([]);
  const [realtimeTokenUsage, setRealtimeTokenUsage] = useState<RealtimeTokenUsage | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const clientRef = useRef<RealtimeVoiceClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const onErrorRef = useRef(onError);
  const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMutedRef = useRef(false);
  const onSessionProgressRef = useRef(onSessionProgress);

  onErrorRef.current = onError;
  onSessionProgressRef.current = onSessionProgress;

  // ─── helpers ──────────────────────────────────────────────

  const teardownMic = useCallback(() => {
    if (processorNodeRef.current) { processorNodeRef.current.disconnect(); processorNodeRef.current = null; }
    if (sourceNodeRef.current) { sourceNodeRef.current.disconnect(); sourceNodeRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach((t) => t.stop()); audioStreamRef.current = null; }
    setIsRecording(false);
    setAudioLevel(0);
  }, []);

  const openMic = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 24000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    audioStreamRef.current = stream;

    const ctx = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    sourceNodeRef.current = source;

    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorNodeRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (isMutedRef.current) { setAudioLevel(0); return; }
      const float32 = e.inputBuffer.getChannelData(0);
      // Compute RMS audio level for waveform visualisation
      let sum = 0;
      for (let i = 0; i < float32.length; i++) sum += float32[i] * float32[i];
      setAudioLevel(Math.sqrt(sum / float32.length));
      const pcm16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      clientRef.current?.sendAudio(pcm16.buffer as ArrayBuffer);
    };

    source.connect(processor);
    processor.connect(ctx.destination);
    setIsRecording(true);
  }, []);

  // ─── public API ───────────────────────────────────────────

  const connectVoice = useCallback(
    async (chatHistory: { role: 'user' | 'assistant'; content: string }[], lastBotMessage?: string) => {
      if (clientRef.current || isConnecting) return;
      setIsConnecting(true);

      // Clear any stale transcript from a previous voice session so the
      // sync effect doesn't re-add old entries to the messages list.
      setTranscript([]);

      try {
        const client = new RealtimeVoiceClient({
          sessionId,
          feature,
          label,
          voice,
          onConnected: () => {
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
            setIsConnected(false);
            setIsConnecting(false);
          },
          onTranscriptUpdate: (text, role, isNewTurn) => {
            setTranscript((prev) => {
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
        });

        clientRef.current = client;
        await client.connect();

        // Wait a small moment for session.created before seeding context
        await new Promise((r) => setTimeout(r, 500));

        if (chatHistory.length > 0) client.seedConversationHistory(chatHistory);
        if (lastBotMessage) client.promptContinuation(lastBotMessage);

        await openMic();
      } catch (err) {
        console.error('Failed to connect voice:', err);
        onErrorRef.current?.('Failed to connect to voice service');
        setIsConnecting(false);
        clientRef.current = null;
      }
    },
    [sessionId, feature, label, voice, isConnecting, openMic, teardownMic],
  );

  const disconnectVoice = useCallback(async () => {
    console.log('[Voice] disconnectVoice called');
    setIsDisconnecting(true);
    teardownMic();
    if (speakingTimeoutRef.current) { clearTimeout(speakingTimeoutRef.current); speakingTimeoutRef.current = null; }
    if (clientRef.current) {
      console.log('[Voice] Client exists — clearing buffer and switching to text');
      clientRef.current.clearAudioBuffer();
      try {
        // Ask the AI to acknowledge the switch to text and wait for it to finish
        // (sendSwitchToText waits for both response.done + audio playback)
        await clientRef.current.sendSwitchToText();
        console.log('[Voice] sendSwitchToText completed');
      } catch (err) {
        console.error('[Voice] sendSwitchToText failed:', err);
      }
      // Now safe to tear down the connection and audio pipeline
      clientRef.current.disconnect();
      clientRef.current = null;
      console.log('[Voice] Client disconnected and cleared');
    } else {
      console.log('[Voice] No client to disconnect — already cleaned up');
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setIsRecording(false);
    setIsDisconnecting(false);
    // Clear transcript so stale entries aren't re-synced if voice mode
    // is re-activated later.
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
    isConnected, isConnecting, isRecording, isSpeaking, isDisconnecting, transcript, realtimeTokenUsage, audioLevel,
    connectVoice, disconnectVoice, startRecording, stopRecording, toggleRecording, sendText, stopAudio,
  };
}
