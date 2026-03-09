'use client';

import React from 'react';

interface VoiceActivityBarsProps {
  /** Normalised audio level 0 → 1 */
  level: number;
  /** Number of bars to render */
  bars?: number;
}

/**
 * Animated vertical bars that react to the current mic audio level.
 * Each bar gets a slightly different height so the visualisation
 * looks organic rather than a single solid block.
 */
export default function VoiceActivityBars({
  level,
  bars = 5,
}: VoiceActivityBarsProps) {
  // Clamp between 0 and 1
  const clamped = Math.max(0, Math.min(1, level));

  // Per-bar height multipliers (centre bars taller)
  const multipliers = Array.from({ length: bars }, (_, i) => {
    const centre = (bars - 1) / 2;
    const dist = Math.abs(i - centre) / centre; // 0 at centre, 1 at edge
    return 1 - dist * 0.45; // centre = 1, edge ≈ 0.55
  });

  return (
    <div className="flex h-8 items-end justify-center gap-[3px]">
      {multipliers.map((m, i) => {
        const minH = 4; // minimum bar height in px
        const maxH = 28; // max bar height in px
        const h = minH + (maxH - minH) * clamped * m;
        return (
          <div
            key={i}
            className="w-[3px] rounded-full bg-red-400 transition-[height] duration-75"
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
}
