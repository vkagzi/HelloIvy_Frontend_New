/**
 * React Hook for Realtime Voice Conversations
 *
 * Generic hook that works for any feature (domain discovery, career discovery, …)
 * by accepting a WebSocket path. Exposes connect / disconnect so the page can
 * start a voice session on-demand.
 */
import { useState, useRef, useCallback } from 'react';
import { RealtimeVoiceClient } from '@/lib/realtime-voice-client';

interface UseRealtimeVoiceOptions {
  sessionId: string;
  /** Feature identifier, e.g. 'domain-discovery' or 'career-discovery' */
  feature: string;
  /** Label for console logs (default: 'Realtime') */
  label?: string;
  onError?: (error: string) => void;
}

export interface RealtimeVoiceMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useRealtimeVoice({ sessionId, feature, label, onError }: UseRealtimeVoiceOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<RealtimeVoiceMessage[]>([]);

  const clientRef = useRef<RealtimeVoiceClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const onErrorRef = useRef(onError);
  const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMutedRef = useRef(false);

  onErrorRef.current = onError;

  // ─── helpers ──────────────────────────────────────────────

  const teardownMic = useCallback(() => {
    if (processorNodeRef.current) { processorNodeRef.current.disconnect(); processorNodeRef.current = null; }
    if (sourceNodeRef.current) { sourceNodeRef.current.disconnect(); sourceNodeRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach((t) => t.stop()); audioStreamRef.current = null; }
    setIsRecording(false);
  }, []);

  const openMic = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 24000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    audioStreamRef.current = stream;

    const ctx = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    sourceNodeRef.current = source;

    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorNodeRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (isMutedRef.current) return;
      const float32 = e.inputBuffer.getChannelData(0);
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

      try {
        const client = new RealtimeVoiceClient({
          sessionId,
          feature,
          label,
          onConnected: () => {
            setIsConnected(true);
            setIsConnecting(false);
          },
          onDisconnected: () => {
            setIsConnected(false);
            setIsRecording(false);
          },
          onError: (error) => {
            console.error('Realtime voice error:', error);
            onErrorRef.current?.(error);
            setIsConnected(false);
            setIsConnecting(false);
          },
          onTranscriptUpdate: (text, role) => {
            setTranscript((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === role) {
                return [...prev.slice(0, -1), { ...last, content: last.content + text }];
              }
              return [...prev, { role, content: text, timestamp: new Date() }];
            });
          },
          onAudioResponse: () => {
            isMutedRef.current = true;
            setIsSpeaking(true);
            if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = setTimeout(() => {
              setIsSpeaking(false);
              isMutedRef.current = false;
              speakingTimeoutRef.current = null;
            }, 500);
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
    [sessionId, feature, label, isConnecting, openMic],
  );

  const disconnectVoice = useCallback(async () => {
    teardownMic();
    if (speakingTimeoutRef.current) { clearTimeout(speakingTimeoutRef.current); speakingTimeoutRef.current = null; }
    if (clientRef.current) {
      clientRef.current.clearAudioBuffer();
      // Ask the AI to say goodbye and wait for it to finish speaking
      await clientRef.current.sendGoodbye();
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
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
    isConnected, isConnecting, isRecording, isSpeaking, transcript,
    connectVoice, disconnectVoice, startRecording, stopRecording, toggleRecording, sendText, stopAudio,
  };
}
