'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FiIcon } from '@/app/_components/Icons';

interface CommunicationModeModalProps {
  open: boolean;
  isPaused?: boolean;
  onSelectText: () => void;
  onSelectVoice: () => void;
}

export default function CommunicationModeModal({
  open,
  isPaused,
  onSelectText,
  onSelectVoice,
}: CommunicationModeModalProps): React.ReactElement {
  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* non-dismissible — user must pick a mode */
      }}
    >
      <DialogContent className="max-w-md">
        <DialogTitle className="text-center">
          How do you wish to interact with Ivy?
        </DialogTitle>
        <DialogDescription className="text-center">
          Choose your preferred way to interact with the AI coach.
        </DialogDescription>

        {isPaused && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-700">
            Your session is currently paused. Selecting either option will resume.
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          {/* Text option */}
          <button
            onClick={onSelectText}
            className="flex flex-1 cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900">
              Text
            </span>
            <span className="text-center text-xs text-gray-500">
              Type your responses
            </span>
          </button>

          {/* Voice option */}
          <button
            onClick={onSelectVoice}
            className="flex flex-1 cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900">
              Voice
            </span>
            <span className="text-center text-xs text-gray-500">
              Speak your responses
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
