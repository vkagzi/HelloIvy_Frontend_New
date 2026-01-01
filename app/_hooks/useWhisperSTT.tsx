'use client';

import { useState, useRef, useCallback } from 'react';

// Browser Speech Recognition types
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export const useWhisperSTT = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startListening = useCallback(async () => {
    try {
      // Check for browser speech recognition support
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        throw new Error(
          'Speech recognition not supported in this browser. Please type your response.'
        );
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      transcriptRef.current = '';

      // Configure recognition with more permissive settings
      recognition.continuous = false; // Changed to false for better reliability
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3; // Try multiple alternatives

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started - speak now!');
        setIsListening(true);

        // Auto-stop after 10 seconds if no speech
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            console.log('Auto-stopping due to timeout');
            recognition.stop();
          }
        }, 10000);
      };

      recognition.onresult = (event: any) => {
        console.log('📝 Speech result received');
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          transcriptRef.current += finalTranscript;
          console.log('✅ Final transcript received:', finalTranscript);
        }

        if (interimTranscript) {
          console.log('⏳ Interim transcript:', interimTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Don't throw error for 'no-speech' - just return empty
        if (event.error === 'no-speech') {
          console.log('No speech detected, but continuing...');
        }
      };

      recognition.onend = () => {
        console.log('🔚 Speech recognition ended');
        setIsListening(false);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
      throw error;
    }
  }, [isListening]);

  const stopListening = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!recognitionRef.current) {
        reject(new Error('No active recognition'));
        return;
      }

      setIsProcessing(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set up the end handler before stopping
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setIsProcessing(false);

        // Give it a moment to process final results
        setTimeout(() => {
          const finalTranscript = transcriptRef.current.trim();
          console.log('🎯 Final combined transcript:', finalTranscript);

          if (!finalTranscript) {
            // Return empty string instead of error - let user try again
            resolve('');
          } else {
            resolve(finalTranscript);
          }
        }, 200);
      };

      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Recognition already stopped');
        setIsListening(false);
        setIsProcessing(false);
        resolve(transcriptRef.current.trim());
      }
    });
  }, []);

  return {
    isListening,
    isProcessing,
    startListening,
    stopListening,
  };
};
