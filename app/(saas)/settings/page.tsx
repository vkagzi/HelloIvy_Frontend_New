'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import logoApp from '@/assets/images/logo-app.png';
import api from '@/lib/api-client';
import { Heading, Label, Paragraph } from '@/app/_components/Typography';
import { IvyWithoutBGLottie } from '@/app/_components/LottieAnimation';
import { useToast } from '@/app/_components/Toast';
import Button from '@/app/_components/Button';

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
    description: "I'm crisp & confident - choose me!",
    gradient: 'from-blue-500 to-indigo-600',
    playingRing: 'ring-blue-400',
    waveBarClass: 'bg-blue-500',
    sampleText: 'Hi, I am your HelloIvy counsellor. I will guide you through your next academic and career decisions.',
  },
  {
    id: 'female',
    label: 'Female',
    description: "I'm calm & clear - pick me!",
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopSample = useCallback((): void => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
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
          <Image src={logoApp} alt="HelloIvy" height={28} className="w-auto" />
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
                className="h-40 animate-pulse rounded-xl bg-neutral-100"
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
                  className={`group relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 px-3 py-5 text-center transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/40 shadow-md'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                  }`}
                >
                  {/* Ivy lottie avatar with gradient ring */}
                  <div
                    className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br ${persona.gradient} p-1 shadow-lg ring-4 transition-all ${
                      isPlaying ? persona.playingRing : isSelected ? 'ring-teal-400' : 'ring-white'
                    }`}
                  >
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                      <IvyWithoutBGLottie
                        loop={isPlaying ? true : 0}
                        animate={isPlaying}
                        className="h-20 w-20"
                      />
                    </div>

                  </div>

                  {/* Sound wave bars — visible only while playing */}
                  <div
                    className={`flex h-5 items-end gap-0.5 transition-opacity duration-300 ${
                      isPlaying ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-hidden
                  >
                    {WAVE_DELAYS.map((delay, i) => (
                      <div
                        key={i}
                        className={`w-1 animate-bounce rounded-full ${persona.waveBarClass}`}
                        style={{
                          height: `${8 + (i % 3) * 6}px`,
                          animationDelay: `${delay}ms`,
                          animationDuration: `${0.6 + (i % 2) * 0.3}s`,
                        }}
                      />
                    ))}
                  </div>

                  <div>
                    <Label size="md" className="font-semibold text-neutral-900">
                      {persona.label}
                    </Label>
                    <Paragraph size="xs" className="mt-0.5 text-neutral-500">
                      {persona.description}
                    </Paragraph>
                  </div>

                  {/* Play / Stop icon button */}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePlaySample(persona.id);
                    }}
                    aria-label={isPlaying ? 'Stop voice sample' : 'Play voice sample'}
                    className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all ${
                      isPlaying
                        ? `bg-linear-to-br ${persona.gradient} text-white`
                        : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {isPlaying ? (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Selection check */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
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
        </div>
        <Paragraph size="sm" className="mt-1 text-neutral-500">
          Choose the regional accent for your HelloIvy counsellor when using live voice mode.
        </Paragraph>

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
              return (
                <div
                  key={acc.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedAccent(acc.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedAccent(acc.id);
                    }
                  }}
                  className={`group relative flex cursor-pointer flex-col justify-between gap-2.5 rounded-xl border-2 p-4 transition-all ${
                    isSelected
                      ? `${acc.selectedBorder} ${acc.selectedBG} shadow-md`
                      : `border-neutral-200 bg-white ${acc.hoverBorder} hover:shadow-sm`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl filter drop-shadow-sm select-none" aria-hidden>{acc.flag}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold select-none ${acc.tagColor}`}>
                      {acc.id.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <Label size="sm" className="font-bold text-neutral-900 block group-hover:text-teal-600 transition-colors">
                      {acc.label}
                    </Label>
                    <Paragraph size="xs" className="mt-1 text-neutral-500 leading-normal">
                      {acc.description}
                    </Paragraph>
                  </div>

                  {/* Selection check */}
                  {isSelected && (
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

      {/* Select Agent Language card */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none" aria-hidden>🌐</span>
          <Label size="lg" className="font-bold">
            Select Agent Language
          </Label>
        </div>
        <Paragraph size="sm" className="mt-1 text-neutral-500">
          Choose the language for your HelloIvy counsellor when using live voice mode.
        </Paragraph>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-neutral-100"
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { id: 'en', label: 'English', flag: '🇬🇧/🇺🇸', desc: 'Default language for all interactions.' },
              { id: 'hi', label: 'Hindi (हिंदी)', flag: '🇮🇳', desc: 'Interactions and counsellor voice in Hindi.' },
            ].map((lang) => {
              const isSelected = selectedLanguage === lang.id;
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
                  className={`group relative flex cursor-pointer flex-col justify-between gap-2.5 rounded-xl border-2 p-4 transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/40 shadow-md'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl filter drop-shadow-sm select-none" aria-hidden>{lang.flag}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold select-none ${
                      isSelected ? 'bg-teal-100 text-teal-700' : 'bg-neutral-100 text-neutral-700'
                    }`}>
                      {lang.id.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <Label size="sm" className="font-bold text-neutral-900 block group-hover:text-teal-600 transition-colors">
                      {lang.label}
                    </Label>
                    <Paragraph size="xs" className="mt-1 text-neutral-500 leading-normal">
                      {lang.desc}
                    </Paragraph>
                  </div>

                  {/* Selection check */}
                  {isSelected && (
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
