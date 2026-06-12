'use client';

import React from 'react';
import { useState } from 'react';
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
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export default function CommunicationModeModal({
  open,
  isPaused,
  onSelectText,
  onSelectVoice,
  selectedLanguage,
  onLanguageChange,
}: CommunicationModeModalProps): React.ReactElement {
  const [showVoicePopup, setShowVoicePopup] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* non-dismissible — user must pick a mode */
      }}
    >
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogTitle className="text-center text-lg font-medium">
          {selectedLanguage === 'hi'
            ? 'आप आईवी (Ivy) के साथ कैसे बातचीत करना चाहते हैं?'
            : 'How do you wish to interact with Ivy?'}
        </DialogTitle>

        {/* Language Selector */}
        {/* <div className="mt-4 flex flex-col items-center border-b pb-4 border-gray-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Choose Language / भाषा चुनें
          </span>
          <div className="mt-2 flex rounded-lg bg-neutral-100 p-1 border border-neutral-200">
            <button
              onClick={() => onLanguageChange('en')}
              className={`flex items-center gap-2 rounded-md px-4 py-1 text-sm font-semibold transition-all cursor-pointer ${
                selectedLanguage === 'en'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>🇺🇸</span> English
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`flex items-center gap-2 rounded-md px-4 py-1 text-sm font-semibold transition-all cursor-pointer ${
                selectedLanguage === 'hi'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-indigo-600'
              }`}
            >
              <span>🇮🇳</span> हिन्दी (Hindi)
            </button>
          </div>
        </div> */}

        <Dialog
          open={showVoicePopup}
          onOpenChange={() => setShowVoicePopup(false)}
        >
          <DialogContent className="max-w-lg">
            <DialogTitle className="text-center text-md font-medium">
              {selectedLanguage === 'hi'
                ? 'आपने वॉइस मोड चुना है — बहुत बढ़िया! 🎧'
                : 'You’ve chosen voice mode — great choice! 🎧'}
            </DialogTitle>

            <div className="mt-4 text-center text-sm text-gray-600">
              {selectedLanguage === 'hi'
                ? 'कृपया सुनिश्चित करें कि आप एक शांत जगह पर हैं जहाँ कम से कम शोर हो, यदि संभव हो तो हेडफ़ोन का उपयोग करें और साफ़ बोलें।'
                : 'Please make sure you’re in a quiet place with minimal background noise, use headphones if possible & speak clearly.'}
              <br />
              {selectedLanguage === 'hi' ? 'जल्द ही बात करते हैं!' : 'Talk soon!'}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white cursor-pointer"
                onClick={() => {
                  setShowVoicePopup(false);
                  onSelectVoice();
                }}
              >
                {selectedLanguage === 'hi' ? 'आगे बढ़ें' : 'Continue'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
        {/* <DialogDescription className="text-center">
          Choose your preferred way to interact with the AI coach.
        </DialogDescription> */}

        {isPaused && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-700">
            {selectedLanguage === 'hi'
              ? 'आपका सत्र वर्तमान में रुका हुआ है। किसी भी विकल्प को चुनने से सत्र फिर से शुरू हो जाएगा।'
              : 'Your session is currently paused. Selecting either option will resume.'}
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
              {selectedLanguage === 'hi' ? 'टेक्स्ट (Text)' : 'Text'}
            </span>
            <span className="text-center text-xs text-gray-500">
              {selectedLanguage === 'hi' ? 'अपने जवाब टाइप करें' : 'Type your responses'}
            </span>
          </button>

          {/* Voice option */}
          <button
            onClick={() => setShowVoicePopup(true)}
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
              {selectedLanguage === 'hi' ? 'आवाज़ (Voice)' : 'Voice'}
            </span>
            <span className="text-center text-xs text-gray-500">
              {selectedLanguage === 'hi' ? 'बोलकर अपने जवाब दें' : 'Speak your responses'}
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
