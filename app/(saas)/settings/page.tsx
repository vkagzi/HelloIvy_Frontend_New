'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import logoApp from '@/assets/images/logo-app.png';
import api from '@/lib/api-client';
import { Heading, Label, Paragraph } from '@/app/_components/Typography';
import { IvyWithoutBGLottie } from '@/app/_components/LottieAnimation';
import { useToast } from '@/app/_components/Toast';
import Button from '@/app/_components/Button';

const IndiaFlag = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 900 600" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="900" height="200" fill="#FF9933" />
    <rect y="200" width="900" height="200" fill="#FFFFFF" />
    <rect y="400" width="900" height="200" fill="#138808" />
    <circle cx="450" cy="300" r="80" fill="none" stroke="#000080" strokeWidth="10" />
    <circle cx="450" cy="300" r="15" fill="#000080" />
    {[...Array(24)].map((_, i) => (
      <line
        key={i}
        x1="450"
        y1="300"
        x2={450 + 80 * Math.cos((i * 15 * Math.PI) / 180)}
        y2={300 + 80 * Math.sin((i * 15 * Math.PI) / 180)}
        stroke="#000080"
        strokeWidth="4"
      />
    ))}
  </svg>
);

const UKFlag = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 60 30" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="30" fill="#012169" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2" />
    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#fff" strokeWidth="10" />
    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

const USFlag = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 741 390" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="741" height="390" fill="#b22234" />
    <path d="M0,30h741M0,90h741M0,150h741M0,210h741M0,270h741M0,330h741" stroke="#fff" strokeWidth="30" />
    <rect width="296" height="210" fill="#3c3b6e" />
    {[...Array(5)].map((_, row) =>
      [...Array(6)].map((_, col) => (
        <circle
          key={`${row}-${col}`}
          cx={25 + col * 49}
          cy={20 + row * 42}
          r="4"
          fill="#fff"
        />
      ))
    )}
  </svg>
);

const EnglishCombinedFlag = ({ className = 'w-full h-full' }: { className?: string }) => (
  <svg viewBox="0 0 60 30" className={className} xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#left-half)">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2" />
      <path d="M30,0 L30,30 M0,15 L60,15" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6" />
    </g>
    <g clipPath="url(#right-half)">
      <rect x="30" width="30" height="30" fill="#b22234" />
      <path d="M30,2.3h30M30,6.9h30M30,11.5h30M30,16.1h30M30,20.7h30M30,25.3h30" stroke="#fff" strokeWidth="2.3" />
      <rect x="30" width="12" height="16.1" fill="#3c3b6e" />
      <circle cx="33" cy="4" r="0.6" fill="#fff" />
      <circle cx="39" cy="4" r="0.6" fill="#fff" />
      <circle cx="36" cy="8" r="0.6" fill="#fff" />
      <circle cx="33" cy="12" r="0.6" fill="#fff" />
      <circle cx="39" cy="12" r="0.6" fill="#fff" />
    </g>
    <defs>
      <clipPath id="left-half">
        <rect x="0" y="0" width="30" height="30" />
      </clipPath>
      <clipPath id="right-half">
        <rect x="30" y="0" width="30" height="30" />
      </clipPath>
    </defs>
  </svg>
);

const MaleIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <circle cx="12" cy="5.5" r="3.5" />
    <path d="M12 11c-4 0-7.5 2.2-7.5 5v6h15v-6c0-2.8-3.5-5-7.5-5z" />
    <line x1="8.5" y1="13" x2="8.5" y2="22" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="15.5" y1="13" x2="15.5" y2="22" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const FemaleIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <circle cx="12" cy="5.5" r="3.5" />
    <path d="M12 11c-2 0-3.5.8-4 2l-3.5 9h15l-3.5-9c-.5-1.2-2-2-4-2z" />
    <line x1="8.2" y1="13" x2="6.7" y2="22" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="15.8" y1="13" x2="17.3" y2="22" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const ACCENT_FLAGS: Record<VoiceAccent, React.ComponentType<{ className?: string }>> = {
  indian: IndiaFlag,
  british: UKFlag,
  american: USFlag,
};

const LANGUAGE_META = {
  en: {
    label: 'English',
    code: 'EN',
    gradient: 'from-blue-500 to-indigo-600',
  },
  hi: {
    label: 'Hindi (हिंदी)',
    code: 'HI',
    gradient: 'from-orange-500 to-rose-600',
  },
};

type VoicePersona = 'male' | 'female';
type VoiceAccent = 'indian' | 'british' | 'american';
type VoiceLanguage = 'en' | 'hi';

type PersonaOption = {
  id: VoicePersona;
  label: string;
  description: string;
  gradient: string;
  playingRing: string;
  waveBarClass: string;
  sampleText: string;
};

const PERSONAS: PersonaOption[] = [
  {
    id: 'male',
    label: 'Male',
    description: "I'm crisp & confident",
    gradient: 'from-blue-500 to-indigo-600',
    playingRing: 'ring-blue-400',
    waveBarClass: 'bg-blue-500',
    sampleText: 'Hi, I am your HelloIvy counsellor. I will guide you through your next academic and career decisions.',
  },
  {
    id: 'female',
    label: 'Female',
    description: "I'm calm & clear",
    gradient: 'from-pink-500 to-rose-600',
    playingRing: 'ring-pink-400',
    waveBarClass: 'bg-pink-500',
    sampleText: 'Hi, I am your HelloIvy counsellor. I will guide you through your next academic and career decisions.',
  },
];

type AccentOption = {
  id: VoiceAccent;
  label: string;
  flag: string;
  description: string;
  hoverBorder: string;
  selectedBG: string;
  selectedBorder: string;
  tagColor: string;
};

const ACCENTS: AccentOption[] = [
  {
    id: 'indian',
    label: 'Indian Accent',
    flag: '🇮🇳',
    description: 'Warm, highly clear regional cadence and pronunciation.',
    hoverBorder: 'hover:border-orange-300',
    selectedBG: 'bg-orange-50/40',
    selectedBorder: 'border-orange-500',
    tagColor: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'british',
    label: 'British Accent',
    flag: '🇬🇧',
    description: 'Polished, professional Received Pronunciation.',
    hoverBorder: 'hover:border-blue-300',
    selectedBG: 'bg-blue-50/40',
    selectedBorder: 'border-blue-500',
    tagColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'american',
    label: 'American Accent',
    flag: '🇺🇸',
    description: 'Natural, clear standard American intonation.',
    hoverBorder: 'hover:border-emerald-300',
    selectedBG: 'bg-emerald-50/40',
    selectedBorder: 'border-emerald-500',
    tagColor: 'bg-emerald-100 text-emerald-700',
  },
];

const WAVE_DELAYS = [0, 250, 100, 350, 150];

const VOICE_MAP: Record<VoicePersona, string> = { male: 'cedar', female: 'marin' };

/** Pre-generated audio samples served from /public/audio/ */
const VOICE_SAMPLE_URLS: Record<VoicePersona, string> = {
  male: '/audio/voice-sample-cedar.mp3',
  female: '/audio/voice-sample-marin.mp3',
};



export default function SettingsPage(): React.ReactElement {
  const [selected, setSelected] = useState<VoicePersona>('male');
  const [saved, setSaved] = useState<VoicePersona>('male');
  const [selectedAccent, setSelectedAccent] = useState<VoiceAccent>('american');
  const [savedAccent, setSavedAccent] = useState<VoiceAccent>('american');
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguage>('en');
  const [savedLanguage, setSavedLanguage] = useState<VoiceLanguage>('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playingPersona, setPlayingPersona] = useState<VoicePersona | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { addToast } = useToast();

  // Pre-load synthesis voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        (window as any)._activeUtterance = null;
      }
    };
  }, []);

  const stopSample = useCallback((): void => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      (window as any)._activeUtterance = null;
    }
    setPlayingPersona(null);
  }, []);

  const handlePlaySample = useCallback(
    (persona: VoicePersona): void => {
      // Toggle off if already playing this persona
      if (playingPersona === persona) {
        stopSample();
        return;
      }

      // Stop any existing playback first
      stopSample();

      setSelected(persona);

      const audio = new Audio(VOICE_SAMPLE_URLS[persona]);
      audioRef.current = audio;

      audio.onended = () => {
        audioRef.current = null;
        setPlayingPersona(null);
      };

      audio.onerror = () => {
        audioRef.current = null;
        setPlayingPersona(null);
      };

      setPlayingPersona(persona);
      audio.play();
    },
    [playingPersona, stopSample]
  );



  useEffect(() => {
    api<{ settings: { voice_persona?: VoicePersona; voice_accent?: VoiceAccent; voice_language?: VoiceLanguage } }>('/api/accounts/settings/')
      .then((data) => {
        const persona = data.settings?.voice_persona || 'male';
        setSelected(persona);
        setSaved(persona);

        const accent = data.settings?.voice_accent || 'american';
        setSelectedAccent(accent);
        setSavedAccent(accent);

        const language = data.settings?.voice_language || 'en';
        setSelectedLanguage(language);
        setSavedLanguage(language);
      })
      .catch(() => {
        // keep defaults
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await api('/api/accounts/settings/', {
        method: 'PUT',
        body: { voice_persona: selected, voice_accent: selectedAccent, voice_language: selectedLanguage },
      });
      setSaved(selected);
      setSavedAccent(selectedAccent);
      setSavedLanguage(selectedLanguage);
      addToast('Voice, accent and language preferences saved successfully!', { type: 'success' });
    } catch {
      addToast('Failed to save voice preferences. Please try again.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [selected, selectedAccent, selectedLanguage, addToast]);

  const dirty = selected !== saved || selectedAccent !== savedAccent || selectedLanguage !== savedLanguage;

  return (
    <div className="mx-auto max-w-2xl py-4">
      <Heading level={2} className="font-extrabold">
        Settings
      </Heading>
      <Paragraph size="sm" className="mt-1 text-neutral-500">
        Manage your workspace preferences and AI configurations.
      </Paragraph>

      {/* Select Your Counsellor Voice card */}
      <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <svg className="h-6 w-6 text-teal-600 animate-pulse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
          <Label size="lg" className="font-bold">
            Select Your Counsellor Voice
          </Label>
        </div>
        {/* <Paragraph size="sm" className="mt-1 text-neutral-500">
          Select how you want HelloIvy&apos;s AI assistant to sound when
          interacting with you.
        </Paragraph> */}

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-neutral-100"
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PERSONAS.map((persona) => {
              const isSelected = selected === persona.id;
              const isPlaying = playingPersona === persona.id;
              return (
                <div
                  key={persona.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(persona.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(persona.id);
                    }
                  }}
                  className={`group relative flex cursor-pointer flex-row items-center gap-4 rounded-xl border-2 px-4 py-3 transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/40 shadow-md'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-xs'
                  }`}
                >
                  {/* Left: Standard Restroom Gender Icon */}
                  <div
                    className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${persona.gradient} p-0.5 shadow-sm ring-2 transition-all ${
                      isPlaying ? persona.playingRing : isSelected ? 'ring-teal-400' : 'ring-white'
                    }`}
                  >
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                      {persona.id === 'male' ? (
                        <MaleIcon className="h-6 w-6 text-blue-500" />
                      ) : (
                        <FemaleIcon className="h-6 w-6 text-pink-500" />
                      )}
                    </div>
                  </div>

                  {/* Middle: Name and description below it */}
                  <div className="flex-1 text-left min-w-0">
                    <Label size="md" className="font-bold text-neutral-900 block leading-tight">
                      {persona.label}
                    </Label>
                    <Paragraph className="mt-0.5 text-neutral-500 text-[10px] sm:text-xs leading-normal">
                      {persona.description}
                    </Paragraph>
                  </div>

                  {/* Right: Audio Wave and Play/Stop controls */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Sound wave bars — visible only while playing */}
                    <div
                      className={`flex h-4 items-end gap-0.5 transition-opacity duration-300 ${
                        isPlaying ? 'opacity-100' : 'opacity-0'
                      }`}
                      aria-hidden
                    >
                      {WAVE_DELAYS.map((delay, i) => (
                        <div
                          key={i}
                          className={`w-0.5 animate-bounce rounded-full ${persona.waveBarClass}`}
                          style={{
                            height: `${6 + (i % 3) * 4}px`,
                            animationDelay: `${delay}ms`,
                            animationDuration: `${0.6 + (i % 2) * 0.3}s`,
                          }}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePlaySample(persona.id);
                      }}
                      aria-label={isPlaying ? 'Stop voice sample' : 'Play voice sample'}
                      className={`flex h-8 w-8 items-center justify-center rounded-full shadow-xs transition-all ${
                        isPlaying
                          ? `bg-linear-to-br ${persona.gradient} text-white`
                          : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {isPlaying ? (
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <rect x="6" y="6" width="12" height="12" rx="1" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Selection check */}
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white shadow-xs">
                      <svg
                        className="h-2.5 w-2.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={4.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Select Agent Language card */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none" aria-hidden>🌐</span>
          <Label size="lg" className="font-bold">
            Select Agent Language
          </Label>
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-neutral-100"
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { id: 'en' },
              { id: 'hi' },
            ].map((lang) => {
              const isSelected = selectedLanguage === lang.id;
              const meta = LANGUAGE_META[lang.id as VoiceLanguage];
              return (
                <div
                  key={lang.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedLanguage(lang.id as VoiceLanguage)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedLanguage(lang.id as VoiceLanguage);
                    }
                  }}
                  className={`group relative flex cursor-pointer flex-row items-center gap-4 rounded-xl border-2 px-4 py-3 transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/40 shadow-md'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-xs'
                  }`}
                >
                  {/* Left: Language Code Logo with Gradient Ring */}
                  <div
                    className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${meta.gradient} p-0.5 shadow-sm ring-2 transition-all ${
                      isSelected ? 'ring-teal-400' : 'ring-white'
                    }`}
                  >
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white select-none">
                      {lang.id === 'en' ? (
                        <span className="font-extrabold text-lg bg-linear-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                          A
                        </span>
                      ) : (
                        <span className="font-extrabold text-lg bg-linear-to-br from-orange-600 to-rose-700 bg-clip-text text-transparent">
                          अ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Language Label and Badge */}
                  <div className="flex-1 text-left min-w-0">
                    <Label size="md" className="font-bold text-neutral-900 block leading-tight">
                      {meta.label}
                    </Label>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold select-none ${
                        isSelected ? 'bg-teal-100 text-teal-700' : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {lang.id.toUpperCase()}
                    </span>
                  </div>

                  {/* Selection check */}
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white shadow-xs">
                      <svg
                        className="h-2.5 w-2.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={4.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Select Your Voice Accent card */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <svg className="h-6 w-6 text-teal-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2a2.5 2.5 0 002.5-2.5V10a2 2 0 00-2-2h-1.5a2 2 0 01-2-2V4.5A2.5 2.5 0 0012 2h-.5a2.5 2.5 0 00-2.5 2.5v.14M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <Label size="lg" className="font-bold">
            Select Your Voice Accent
          </Label>
          {selectedLanguage === 'hi' && (
            <span className="text-xs font-semibold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-md ml-auto animate-fade-in">
              Not applicable for Hindi
            </span>
          )}
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-neutral-100"
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ACCENTS.map((acc) => {
              const isSelected = selectedAccent === acc.id;
              const isDisabled = selectedLanguage === 'hi';
              const FlagComponent = ACCENT_FLAGS[acc.id];
              return (
                <div
                  key={acc.id}
                  role="button"
                  tabIndex={isDisabled ? undefined : 0}
                  onClick={() => {
                    if (!isDisabled) {
                      setSelectedAccent(acc.id);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (isDisabled) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedAccent(acc.id);
                    }
                  }}
                  className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 transition-all ${
                    isDisabled
                      ? 'border-neutral-100 bg-neutral-50/50 opacity-40 cursor-not-allowed pointer-events-none'
                      : isSelected
                        ? `${acc.selectedBorder} ${acc.selectedBG} shadow-md`
                        : `border-neutral-200 bg-white ${acc.hoverBorder} hover:shadow-sm`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-12 overflow-hidden rounded shadow-sm border border-neutral-100 flex items-center justify-center bg-white">
                      <FlagComponent className="h-full w-full object-cover" />
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold select-none ${
                      isDisabled ? 'bg-neutral-200 text-neutral-400' : acc.tagColor
                    }`}>
                      {acc.id.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <Label size="sm" className={`font-bold block transition-colors ${
                      isDisabled ? 'text-neutral-400' : 'text-neutral-900 group-hover:text-teal-600'
                    }`}>
                      {acc.label}
                    </Label>
                  </div>

                  {/* Selection check */}
                  {isSelected && !isDisabled && (
                    <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-white shadow-sm">
                      <svg
                        className="h-2.5 w-2.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={4.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant='outline'
          disabled={!dirty}
          onClick={() => {
            setSelected(saved);
            setSelectedAccent(savedAccent);
            setSelectedLanguage(savedLanguage);
          }}
          className="rounded-lg border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!dirty || saving}
          onClick={handleSave}
          className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
