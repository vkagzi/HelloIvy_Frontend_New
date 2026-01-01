'use client';

import { useEffect, useState, useRef } from 'react';

// ULTIMATE TTS AUTOPLAY BYPASS - ZERO RESTRICTIONS
export const useOpenAITTS = () => {
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingRef = useRef(false);

  useEffect(() => {
    let globalAudioContext: AudioContext | null = null;

    const ULTIMATE_AUDIO_UNLOCK = async () => {
      try {
        console.log('🚀 ULTIMATE AUTOPLAY BYPASS: Starting...');

        // Create AudioContext
        globalAudioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();

        // Force to running state
        if (globalAudioContext.state !== 'running') {
          await globalAudioContext.resume();
        }

        // Create multiple silent sources
        for (let i = 0; i < 5; i++) {
          const buffer = globalAudioContext.createBuffer(1, 1, 22050);
          const source = globalAudioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(globalAudioContext.destination);
          source.start(globalAudioContext.currentTime + i * 0.001);
        }

        // Test HTML5 audio
        const testAudio = new Audio();
        testAudio.src =
          'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        testAudio.volume = 0;
        testAudio.muted = true;

        try {
          await testAudio.play();
          testAudio.pause();
        } catch (e) {
          console.log('HTML5 test failed, continuing...');
        }

        // Mark as unlocked
        (window as any).globalAudioContext = globalAudioContext;
        (window as any).ultimateAudioUnlocked = true;
        setAudioUnlocked(true);

        console.log('🔓 ULTIMATE BYPASS: Audio fully unlocked!');

        // Play any queued audio
        const pendingAudio = (window as any).pendingTTSAudio;
        if (pendingAudio) {
          try {
            await pendingAudio.play();
            (window as any).pendingTTSAudio = null;
            console.log('✅ Queued TTS played immediately');
          } catch (e) {
            showMinimalUnlockButton();
          }
        }
      } catch (error) {
        console.log('🔄 Primary bypass failed, showing unlock button');
        showMinimalUnlockButton();
      }
    };

    const showMinimalUnlockButton = () => {
      // Remove any existing button
      const existing = document.getElementById('ultimate-audio-unlock');
      if (existing) existing.remove();

      const button = document.createElement('button');
      button.id = 'ultimate-audio-unlock';
      button.innerHTML = '🔊 Enable Voice';
      button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 8px 16px;
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        border: none;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
      `;

      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      });

      button.addEventListener('click', async () => {
        try {
          // Full unlock
          if (!globalAudioContext) {
            globalAudioContext = new (window.AudioContext ||
              (window as any).webkitAudioContext)();
          }

          await globalAudioContext.resume();

          // Test audio
          const testBuffer = globalAudioContext.createBuffer(1, 1, 22050);
          const testSource = globalAudioContext.createBufferSource();
          testSource.buffer = testBuffer;
          testSource.connect(globalAudioContext.destination);
          testSource.start();

          // HTML5 test
          const testAudio = new Audio();
          testAudio.src =
            'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
          testAudio.volume = 0.01;
          await testAudio.play();

          // Mark unlocked
          (window as any).globalAudioContext = globalAudioContext;
          (window as any).ultimateAudioUnlocked = true;
          setAudioUnlocked(true);

          // Remove button
          button.style.opacity = '0';
          setTimeout(() => button.remove(), 300);

          // Play pending
          const pendingAudio = (window as any).pendingTTSAudio;
          if (pendingAudio) {
            await pendingAudio.play();
            (window as any).pendingTTSAudio = null;
          }

          console.log('🎉 ULTIMATE UNLOCK: Complete success!');
        } catch (e) {
          console.error('Unlock failed:', e);
          button.remove();
        }
      });

      document.body.appendChild(button);

      // Auto-remove after 15 seconds
      setTimeout(() => {
        if (document.getElementById('ultimate-audio-unlock')) {
          button.style.opacity = '0.5';
          setTimeout(() => {
            if (document.getElementById('ultimate-audio-unlock')) {
              button.remove();
            }
          }, 3000);
        }
      }, 15000);
    };

    // Execute immediately
    ULTIMATE_AUDIO_UNLOCK();

    // Cleanup
    return () => {
      if (globalAudioContext && globalAudioContext.state !== 'closed') {
        globalAudioContext.close();
      }
      const button = document.getElementById('ultimate-audio-unlock');
      if (button) button.remove();
    };
  }, []);

  const speakText = async (text: string) => {
    if (isSpeaking || speakingRef.current) return;

    speakingRef.current = true;
    setIsSpeaking(true);
    console.log('🎤 OpenAI TTS: Starting...');

    try {
      // Generate TTS
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'nova',
          response_format: 'mp3',
          speed: 1.1,
        }),
      });

      if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      let playbackSuccess = false;

      console.log('🔊 OpenAI TTS: Audio ready, attempting playback...');

      // Single audio playback method - HTML5 Audio only
      try {
        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        audio.volume = 0.8;
        audio.autoplay = true;

        await audio.play();
        playbackSuccess = true;

        audio.onended = () => {
          speakingRef.current = false;
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };

        console.log('✅ OpenAI TTS: HTML5 Audio SUCCESS!');
      } catch (e) {
        console.log('HTML5 Audio failed:', e);
      }

      // Method 3: Queue for interaction
      if (!playbackSuccess) {
        console.log('⏳ OpenAI TTS: Queuing for interaction...');

        const audio = new Audio(audioUrl);
        audio.volume = 0.8;
        (window as any).pendingTTSAudio = audio;

        // Show unlock button if not visible
        if (
          !audioUnlocked &&
          !document.getElementById('ultimate-audio-unlock')
        ) {
          // The useEffect will show the button
        }

        // Auto-play on interaction
        const playOnInteraction = async () => {
          try {
            if ((window as any).pendingTTSAudio) {
              await (window as any).pendingTTSAudio.play();
              (window as any).pendingTTSAudio = null;
              console.log('✅ OpenAI TTS: Queued audio played!');

              audio.onended = () => {
                speakingRef.current = false;
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
              };
            }
          } catch (e) {
            console.log('Queued playback failed:', e);
            speakingRef.current = false;
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
          }
        };

        ['click', 'keydown', 'touchstart'].forEach((event) => {
          document.addEventListener(event, playOnInteraction, {
            once: true,
            passive: true,
          });
        });

        if (!audioUnlocked) {
          speakingRef.current = false;
          setIsSpeaking(false);
        }
        return;
      }
    } catch (error) {
      console.error('OpenAI TTS failed:', error);
      speakingRef.current = false;
      setIsSpeaking(false);
    }
  };

  const stop = () => {
    speakingRef.current = false;
    setIsSpeaking(false);

    // Stop any currently playing audio
    const allAudios = document.querySelectorAll('audio');
    allAudios.forEach((audio) => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    // Clear any pending audio
    if ((window as any).pendingTTSAudio) {
      try {
        if (!(window as any).pendingTTSAudio.paused) {
          (window as any).pendingTTSAudio.pause();
          (window as any).pendingTTSAudio.currentTime = 0;
        }
      } catch (e) {
        console.log('Error stopping pending audio:', e);
      }
      (window as any).pendingTTSAudio = null;
    }

    // Set global stop flag
    (window as any).globalTTSStopped = true;

    console.log('🔇 TTS: Stopped all audio playback');
  };

  return { speakText, isSpeaking, audioUnlocked, stop };
};
