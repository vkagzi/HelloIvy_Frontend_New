'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { generateSpeechStream } from '@/lib/api';
import { RealtimeTranscriptionClient } from '@/lib/realtime-transcription-client';

interface UseAudioTranscriptionOptions {
  onError?: (error: string) => void;
}

/** Check if the browser can stream MP3 via MediaSource. */
function canStreamMp3(): boolean {
  if (typeof MediaSource === 'undefined') return false;
  return MediaSource.isTypeSupported('audio/mpeg');
}

export function useAudioTranscription({ onError }: UseAudioTranscriptionOptions = {}) {
  // ─── TTS state ─────────────────────────────────────────────
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // ─── STT state ─────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const transcriptionClientRef = useRef<RealtimeTranscriptionClient | null>(null);

  // ─── TTS helpers ──────────────────────────────────────────
  const cleanupAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cleanupAudio();
  }, [cleanupAudio]);

  // ─── TTS: speak text (streaming) ─────────────────────────
  const speakText = useCallback(
    async (text: string): Promise<void> => {
      if (!text.trim()) return;
      stopSpeaking();
      setIsSpeaking(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await generateSpeechStream(
          text.slice(0, 4096),
          undefined,
          undefined,
          abortController.signal,
        );

        if (!response.body) throw new Error('No response body');

        const audio = new Audio();
        currentAudioRef.current = audio;

        const onFinish = () => cleanupAudio();
        audio.addEventListener('ended', onFinish);
        audio.addEventListener('error', onFinish);

        if (canStreamMp3()) {
          // ── MediaSource path: start playback as first chunk arrives ──
          const mediaSource = new MediaSource();
          const url = URL.createObjectURL(mediaSource);
          currentAudioUrlRef.current = url;
          audio.src = url;

          // Wait for the MediaSource to be ready
          await new Promise<void>((resolve) => {
            mediaSource.addEventListener('sourceopen', () => resolve(), { once: true });
          });

          const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
          const reader = response.body.getReader();
          let started = false;

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Append chunk and wait until the buffer has processed it
            await new Promise<void>((resolve, reject) => {
              sourceBuffer.addEventListener('updateend', () => resolve(), { once: true });
              sourceBuffer.addEventListener('error', () => reject(new Error('SourceBuffer error')), { once: true });
              sourceBuffer.appendBuffer(value);
            });

            // Start playback as soon as the very first chunk is buffered
            if (!started) {
              started = true;
              await audio.play();
            }
          }

          // Signal that no more data will arrive
          if (mediaSource.readyState === 'open') {
            mediaSource.endOfStream();
          }
        } else {
          // ── Fallback: buffer entire response then play ──
          const reader = response.body.getReader();
          const chunks: BlobPart[] = [];
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          const blob = new Blob(chunks, { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          currentAudioUrlRef.current = url;
          audio.src = url;
          await audio.play();
        }
      } catch (err) {
        if (abortController.signal.aborted) return;
        console.error('TTS error:', err);
        setIsSpeaking(false);
        onErrorRef.current?.('Failed to play audio');
      }
    },
    [stopSpeaking, cleanupAudio],
  );

  // ─── STT: start / stop listening ─────────────────────────
  const stopListening = useCallback(async (): Promise<string> => {
    const client = transcriptionClientRef.current;
    let finalTranscript = '';
    if (client) {
      transcriptionClientRef.current = null;
      finalTranscript = await client.commitAndDisconnect();
    }
    setIsListening(false);
    setAudioLevel(0);
    return finalTranscript;
  }, []);

  const startListening = useCallback(async () => {
    // Hard-disconnect any previous session (no commit)
    if (transcriptionClientRef.current) {
      transcriptionClientRef.current.disconnect();
      transcriptionClientRef.current = null;
    }
    setLiveTranscript('');
    setAudioLevel(0);

    const client = new RealtimeTranscriptionClient({
      onOpen: () => {
        setIsListening(true);
      },
      onClose: () => {
        setIsListening(false);
        setAudioLevel(0);
        transcriptionClientRef.current = null;
      },
      onTranscript: (transcript) => {
        setLiveTranscript(transcript);
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
      },
      onError: (error) => {
        console.error('Realtime transcription error:', error);
        onErrorRef.current?.(`Mic error: ${error}`);
      },
    });

    transcriptionClientRef.current = client;

    try {
      await client.connect();
    } catch {
      transcriptionClientRef.current = null;
      setIsListening(false);
    }
  }, []);

  // ─── Cleanup on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (transcriptionClientRef.current) {
        transcriptionClientRef.current.disconnect();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
    };
  }, []);

  return {
    // TTS
    isSpeaking,
    ttsEnabled,
    setTtsEnabled,
    speakText,
    stopSpeaking,
    // STT
    isListening,
    liveTranscript,
    setLiveTranscript,
    startListening,
    stopListening,
    audioLevel,
  };
}
