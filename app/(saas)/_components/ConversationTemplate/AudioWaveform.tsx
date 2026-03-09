'use client';

import React, { useRef, useEffect } from 'react';

interface AudioWaveformProps {
  /** Normalised audio level 0 → 1 */
  level: number;
  /** Whether actively listening */
  active: boolean;
  /** Filled bar color */
  color?: string;
  /** Unfilled (upcoming) bar color */
  trackColor?: string;
}

const BAR_WIDTH = 2;
const GAP = 1.5;
const SAMPLE_INTERVAL_MS = 60; // push a new bar every ~60ms

/**
 * Scrolling audio waveform.
 *
 * - Full-width: bars fill the entire canvas.
 * - A history buffer records the mic level over time.
 * - Filled bars (left) show recorded audio; track bars (right) are a
 *   muted placeholder that hasn't been "reached" yet.
 * - The waveform scrolls left as new samples arrive.
 */
export default function AudioWaveform({
  level,
  active,
  color = 'rgba(107, 114, 128, 0.85)',
  trackColor = 'rgba(209, 213, 219, 0.5)',
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Scrolling history: each entry is a normalised level (0–1)
  const historyRef = useRef<number[]>([]);
  const lastSampleTimeRef = useRef(0);

  const levelRef = useRef(level);
  const activeRef = useRef(active);
  const colorRef = useRef(color);
  const trackColorRef = useRef(trackColor);
  levelRef.current = level;
  activeRef.current = active;
  colorRef.current = color;
  trackColorRef.current = trackColor;

  // Reset history when recording starts
  const wasActive = useRef(false);
  useEffect(() => {
    if (active && !wasActive.current) {
      historyRef.current = [];
      lastSampleTimeRef.current = 0;
    }
    wasActive.current = active;
  }, [active]);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // How many bars fit in the full width
      const step = BAR_WIDTH + GAP;
      const totalBars = Math.floor((w + GAP) / step);

      // Sample new audio level into history
      const now = Date.now();
      if (activeRef.current && now - lastSampleTimeRef.current >= SAMPLE_INTERVAL_MS) {
        const raw = levelRef.current;
        const amplified = Math.min(1, Math.pow(raw * 8, 0.6));
        historyRef.current.push(Math.max(0, amplified));
        lastSampleTimeRef.current = now;

        // Trim history to max visible bars so it doesn't grow forever
        if (historyRef.current.length > totalBars) {
          historyRef.current = historyRef.current.slice(
            historyRef.current.length - totalBars,
          );
        }
      }

      const history = historyRef.current;
      const filledCount = history.length;
      const centreY = h / 2;
      const minBarH = 3;

      // Draw right-to-left: filled bars are on the right, track on the left.
      // The newest sample is at the right edge.
      const trackCount = totalBars - filledCount;

      for (let i = 0; i < totalBars; i++) {
        const x = i * step;
        const isFilled = i >= trackCount;

        let barH: number;
        if (isFilled) {
          const historyIndex = i - trackCount;
          const lvl = history[historyIndex];
          barH = Math.max(minBarH, lvl * (h * 0.85));
        } else {
          barH = minBarH;
        }

        ctx.fillStyle = isFilled ? colorRef.current : trackColorRef.current;
        ctx.beginPath();
        ctx.roundRect(x, centreY - barH / 2, BAR_WIDTH, barH, BAR_WIDTH);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, []); // intentionally empty — reads from refs

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ display: 'block' }}
    />
  );
}
