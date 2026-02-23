'use client';

import React, { memo, useCallback, useEffect, useState } from 'react';

interface SessionTimerProps {
  sessionCreatedAt: string;
  isPaused: boolean;
  totalPausedSeconds: number;
  pauseLoading: boolean;
  sessionEnded: boolean;
  onTogglePause: () => void;
  /** Primary accent colour – defaults to 'purple' */
  accentColor?: 'purple' | 'teal';
}

/**
 * Self-contained timer widget.
 *
 * `timeRemaining` lives **inside** this component, so the 1-second
 * interval only re-renders the timer – not the parent conversation page.
 */
const SessionTimer: React.FC<SessionTimerProps> = ({
  sessionCreatedAt,
  isPaused,
  totalPausedSeconds,
  pauseLoading,
  sessionEnded,
  onTogglePause,
  accentColor = 'purple',
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const updateTimer = useCallback(() => {
    if (isPaused) return;

    const createdTime = new Date(sessionCreatedAt).getTime();
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - createdTime) / 1000);

    // 30 minutes + 5 seconds grace = 1805 seconds, minus paused time
    const totalSeconds = 30 * 60 + 5;
    const remaining = Math.max(
      0,
      totalSeconds - elapsedSeconds + totalPausedSeconds,
    );

    setTimeRemaining(remaining);
  }, [isPaused, sessionCreatedAt, totalPausedSeconds]);

  useEffect(() => {
    if (isPaused) return;

    // Update immediately
    updateTimer();

    // Tick every second
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isPaused, updateTimer]);

  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const defaultColor = accentColor === 'teal' ? 'teal' : 'purple';

  const containerClass = isPaused
    ? 'border-yellow-300 bg-yellow-50'
    : timeRemaining <= 60
      ? 'border-red-300 bg-red-50'
      : timeRemaining <= 300
        ? 'border-orange-300 bg-orange-50'
        : defaultColor === 'teal'
          ? 'border-teal-300 bg-teal-50'
          : 'border-purple-300 bg-purple-50';

  const textClass = isPaused
    ? 'text-yellow-700'
    : timeRemaining <= 60
      ? 'text-red-700'
      : timeRemaining <= 300
        ? 'text-orange-700'
        : defaultColor === 'teal'
          ? 'text-teal-700'
          : 'text-purple-700';

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${containerClass}`}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className={`text-sm font-semibold ${textClass}`}>
        {isPaused ? 'Paused' : formatTime(timeRemaining)}
      </span>
      <button
        onClick={onTogglePause}
        disabled={pauseLoading || sessionEnded}
        className={`ml-1 rounded p-0.5 transition-colors ${
          isPaused
            ? 'text-yellow-700 hover:bg-yellow-200'
            : 'text-gray-500 hover:bg-gray-200'
        } disabled:opacity-50`}
        title={isPaused ? 'Resume timer' : 'Pause timer'}
      >
        {isPaused ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default memo(SessionTimer);
