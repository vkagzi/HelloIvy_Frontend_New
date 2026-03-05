'use client';

import React, { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api-client';
import { Heading, Label, Paragraph } from '@/app/_components/Typography';

type VoicePersona = 'professional' | 'friendly' | 'academic';

const PERSONAS: {
  id: VoicePersona;
  label: string;
  description: string;
  gradient: string;
  initials: string;
}[] = [
  {
    id: 'professional',
    label: 'Professional',
    description:
      'A clear, formal, and authoritative tone suitable for business environments.',
    gradient: 'from-slate-600 to-slate-800',
    initials: 'PR',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    description:
      'A warm, approachable, and engaging voice for daily collaborative interactions.',
    gradient: 'from-amber-400 to-orange-500',
    initials: 'FR',
  },
  {
    id: 'academic',
    label: 'Academic',
    description:
      'A sophisticated and informative tone focused on research and deep learning.',
    gradient: 'from-indigo-500 to-purple-600',
    initials: 'AC',
  },
];

export default function SettingsPage(): React.ReactElement {
  const [selected, setSelected] = useState<VoicePersona>('professional');
  const [saved, setSaved] = useState<VoicePersona>('professional');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ settings: { voice_persona?: VoicePersona } }>('/api/accounts/settings/')
      .then((data) => {
        const persona = data.settings?.voice_persona || 'professional';
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

      {/* Voice Persona card */}
      <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-teal-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
            />
          </svg>
          <Label size="lg" className="font-bold">
            Voice Persona
          </Label>
        </div>
        <Paragraph size="sm" className="mt-1 text-neutral-500">
          Select how you want HelloIvy&apos;s AI assistant to sound when
          interacting with you.
        </Paragraph>

        {loading ? (
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl bg-neutral-100"
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-3 gap-4">
            {PERSONAS.map((persona) => {
              const isSelected = selected === persona.id;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => setSelected(persona.id)}
                  className={`group relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 px-3 py-5 text-center transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/40 shadow-md'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br ${
                      persona.gradient
                    } text-sm font-bold tracking-wider text-white shadow-lg ring-2 ${
                      isSelected ? 'ring-teal-400' : 'ring-white'
                    }`}
                  >
                    {persona.initials}
                  </div>

                  <div>
                    <Label size="md" className="font-semibold text-neutral-900">
                      {persona.label}
                    </Label>
                    <Paragraph size="xs" className="mt-0.5 text-neutral-500">
                      {persona.description}
                    </Paragraph>
                  </div>

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
                </button>
              );
            })}
          </div>
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
