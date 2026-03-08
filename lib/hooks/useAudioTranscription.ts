'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { generateSpeechStream } from '@/lib/api';

interface UseAudioTranscriptionOptions {
  onError?: (error: string) => void;
}

/** Minimal interface matching the browser SpeechRecognition API surface we use. */
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionResultItem {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultItem;
  };
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const win = window as unknown as Record<string, SpeechRecognitionCtor | undefined>;
  return win.SpeechRecognition ?? win.webkitSpeechRecognition;
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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

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
  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      onErrorRef.current?.('Speech recognition is not supported in this browser');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new Ctor();
    recognitionRef.current = recognition;
    setLiveTranscript('');

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setLiveTranscript(final + interim);
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
        onErrorRef.current?.(`Mic error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      onErrorRef.current?.('Failed to start microphone');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // ─── Cleanup on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
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
  };
}
