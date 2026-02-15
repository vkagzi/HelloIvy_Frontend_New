/**
 * React Hook for Domain Discovery Realtime Voice Conversations
 *
 * The hook exposes connect / disconnect so the page can start a voice
 * session on-demand (e.g. when the user clicks the mic button) rather
 * than auto-connecting via an `enabled` flag.
 */
import { useState, useRef, useCallback } from 'react';
import { DomainRealtimeVoiceClient } from '@/lib/domain-discovery-realtime';

interface UseRealtimeVoiceOptions {
  sessionId: string;
  onError?: (error: string) => void;
}

export interface RealtimeVoiceMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useRealtimeVoice({ sessionId, onError }: UseRealtimeVoiceOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<RealtimeVoiceMessage[]>([]);
  
  const clientRef = useRef<DomainRealtimeVoiceClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const onErrorRef = useRef(onError);

  // Keep onError ref current without re-creating callbacks
  onErrorRef.current = onError;

  // ─── helpers ──────────────────────────────────────────────

  /** Clean up mic / audio nodes without touching the WebSocket */
  const teardownMic = useCallback(() => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    setIsRecording(false);
  }, []);

  /** Open the microphone and start streaming PCM16 to the server */
  const openMic = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 24000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    audioStreamRef.current = stream;

    const ctx = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    sourceNodeRef.current = source;

    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorNodeRef.current = processor;

    processor.onaudioprocess = (e) => {
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

  /**
   * Connect to the voice service, seed conversation history,
   * and have the AI repeat / continue from the last bot message.
   *
   * @param chatHistory  Full chat messages so far (bot & user)
   * @param lastBotMessage  The last AI message to repeat via voice
   */
  const connectVoice = useCallback(
    async (chatHistory: { role: 'user' | 'assistant'; content: string }[], lastBotMessage?: string) => {
      if (clientRef.current || isConnecting) return;

      setIsConnecting(true);

      try {
        const client = new DomainRealtimeVoiceClient({
          sessionId,
          onConnected: () => {
            console.log('Realtime voice connected');
            setIsConnected(true);
            setIsConnecting(false);
          },
          onDisconnected: () => {
            console.log('Realtime voice disconnected');
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
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content + text },
                ];
              }
              return [...prev, { role, content: text, timestamp: new Date() }];
            });
          },
          onAudioResponse: () => {
            setIsSpeaking(true);
            setTimeout(() => setIsSpeaking(false), 100);
          },
        });

        clientRef.current = client;

        await client.connect();

        // Wait a small moment for session.created before seeding context
        await new Promise((r) => setTimeout(r, 500));

        // Seed conversation history into the realtime session so the
        // AI has full context of the previous chat exchange.
        if (chatHistory.length > 0) {
          client.seedConversationHistory(chatHistory);
        }

        // Ask the AI to speak the last bot message (or a continuation)
        if (lastBotMessage) {
          client.promptContinuation(lastBotMessage);
        }

        // Open microphone
        await openMic();
      } catch (err) {
        console.error('Failed to connect voice:', err);
        onErrorRef.current?.('Failed to connect to voice service');
        setIsConnecting(false);
        clientRef.current = null;
      }
    },
    [sessionId, isConnecting, openMic],
  );

  /** Disconnect from voice and clean up everything */
  const disconnectVoice = useCallback(() => {
    teardownMic();
    if (clientRef.current) {
      clientRef.current.commitAudio();
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setIsConnected(false);
    setTranscript([]);
  }, [teardownMic]);

  // Start recording (mic only — assumes already connected)
  const startRecording = useCallback(async () => {
    if (!clientRef.current || !isConnected) {
      console.warn('Cannot start recording: client not connected');
      return;
    }
    try {
      await openMic();
    } catch (error) {
      console.error('Error starting recording:', error);
      onErrorRef.current?.('Failed to access microphone');
    }
  }, [isConnected, openMic]);

  // Stop recording (mic only — keeps WS alive)
  const stopRecording = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.commitAudio();
    }
    teardownMic();
  }, [teardownMic]);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Send text message
  const sendText = useCallback((text: string) => {
    if (clientRef.current && isConnected) {
      clientRef.current.sendText(text);
    }
  }, [isConnected]);

  // Stop audio playback
  const stopAudio = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.stopAudio();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    isRecording,
    isSpeaking,
    transcript,
    connectVoice,
    disconnectVoice,
    startRecording,
    stopRecording,
    toggleRecording,
    sendText,
    stopAudio,
  };
}
