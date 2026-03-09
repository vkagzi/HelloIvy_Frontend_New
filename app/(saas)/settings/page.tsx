'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import logoApp from '@/assets/images/logo-app.png';
import api from '@/lib/api-client';
import { Heading, Label, Paragraph } from '@/app/_components/Typography';
import { IvyWithoutBGLottie } from '@/app/_components/LottieAnimation';

type VoicePersona = 'male' | 'female';

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
    description: 'A confident male voice for your counselling sessions.',
    gradient: 'from-blue-500 to-indigo-600',
    playingRing: 'ring-blue-400',
    waveBarClass: 'bg-blue-500',
    sampleText: 'Hi, I am your HelloIvy counsellor. I will guide you through your next academic and career decisions.',
  },
  {
    id: 'female',
    label: 'Female',
    description: 'A warm female voice for your counselling sessions.',
    gradient: 'from-pink-500 to-rose-600',
    playingRing: 'ring-pink-400',
    waveBarClass: 'bg-pink-500',
    sampleText: 'Hi, I am your HelloIvy counsellor. I will guide you through your next academic and career decisions.',
  },
];

const WAVE_DELAYS = [0, 250, 100, 350, 150];

export default function SettingsPage(): React.ReactElement {
  const [selected, setSelected] = useState<VoicePersona>('male');
  const [saved, setSaved] = useState<VoicePersona>('male');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playingPersona, setPlayingPersona] = useState<VoicePersona | null>(null);
  const [audioSupported, setAudioSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setAudioSupported(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSample = useCallback((): void => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setPlayingPersona(null);
  }, []);

  const handlePlaySample = useCallback(
    (persona: VoicePersona): void => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      if (playingPersona === persona) {
        stopSample();
        return;
      }

      const selectedPersona = PERSONAS.find((item) => item.id === persona);
      if (!selectedPersona) {
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(
        selectedPersona.sampleText
      );
      utterance.rate = 1;
      utterance.pitch = persona === 'female' ? 1.15 : 0.9;

      const availableVoices = window.speechSynthesis.getVoices();
      const normalizedPersona = persona.toLowerCase();
      const matchedVoice = availableVoices.find((voice) => {
        const voiceName = voice.name.toLowerCase();
        return voiceName.includes(normalizedPersona);
      });

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        utteranceRef.current = null;
        setPlayingPersona(null);
      };

      utterance.onerror = () => {
        utteranceRef.current = null;
        setPlayingPersona(null);
      };

      utteranceRef.current = utterance;
      setSelected(persona);
      setPlayingPersona(persona);
      window.speechSynthesis.speak(utterance);
    },
    [playingPersona, stopSample]
  );

  useEffect(() => {
    api<{ settings: { voice_persona?: VoicePersona } }>('/api/accounts/settings/')
      .then((data) => {
        const persona = data.settings?.voice_persona || 'male';
        setSelected(persona);
        setSaved(persona);
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
        body: { voice_persona: selected },
      });
      setSaved(selected);
    } finally {
      setSaving(false);
    }
  }, [selected]);

  const dirty = selected !== saved;

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
          <Image src={logoApp} alt="HelloIvy" height={32} className="w-auto" />
          <Label size="lg" className="font-bold">
            Select Your Counsellor Voice
          </Label>
        </div>
        <Paragraph size="sm" className="mt-1 text-neutral-500">
          Select how you want HelloIvy&apos;s AI assistant to sound when
          interacting with you.
        </Paragraph>

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
                    disabled={!audioSupported}
                    aria-label={isPlaying ? 'Stop voice sample' : 'Play voice sample'}
                    className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
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

        {!audioSupported && (
          <Paragraph size="xs" className="mt-3 text-neutral-500">
            Voice preview is not supported in this browser.
          </Paragraph>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          disabled={!dirty}
          onClick={() => setSelected(saved)}
          className="rounded-lg border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={handleSave}
          className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
