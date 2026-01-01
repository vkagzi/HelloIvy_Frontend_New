'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Global TTS Manager Hook
 * Automatically stops TTS when navigating between pages
 * Use this hook on every page that might have TTS
 */
export const useGlobalTTSManager = () => {
  const router = useRouter();

  useEffect(() => {
    // Function to stop all TTS activity
    const stopAllTTS = () => {
      console.log('🔇 Global TTS Manager: Stopping all TTS on page change');

      // Stop all currently playing audio elements
      const allAudios = document.querySelectorAll('audio');
      allAudios.forEach((audio) => {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      });

      // Clear any pending TTS audio
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

      // Set global stop flags
      (window as any).globalTTSStopped = true;
      (window as any).forceStopTTS = true;

      // Remove any unlock buttons
      const unlockButton = document.getElementById('ultimate-audio-unlock');
      if (unlockButton) {
        unlockButton.remove();
      }
    };

    // Stop TTS when the component unmounts (page navigation)
    const handleBeforeUnload = () => {
      stopAllTTS();
    };

    // Listen for page visibility changes (browser tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAllTTS();
      }
    };

    // Listen for popstate events (back/forward navigation)
    const handlePopState = () => {
      stopAllTTS();
    };

    // Listen for route changes in Next.js
    const handleRouteChange = () => {
      stopAllTTS();
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);

    // Set up global TTS stop function
    (window as any).stopAllTTS = stopAllTTS;

    // Cleanup function - this runs when the component unmounts (page navigation)
    return () => {
      stopAllTTS();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Provide a manual stop function for components to use
  const stopTTS = () => {
    if ((window as any).stopAllTTS) {
      (window as any).stopAllTTS();
    }
  };

  return { stopTTS };
};
