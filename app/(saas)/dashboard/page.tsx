'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import imgDashboardGraphic from '@/assets/images/dashboard-graphic.png';
import Link from 'next/link';
import { Heading, Label } from '@/app/_components/Typography';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';
import api from '@/lib/api-client';

type VoicePersona = 'male' | 'female';

const PERSONA_META: Record<
  VoicePersona,
  { label: string; gradient: string; initials: string }
> = {
  male: {
    label: 'Male',
    gradient: 'from-blue-500 to-indigo-600',
    initials: 'M',
  },
  female: {
    label: 'Female',
    gradient: 'from-pink-500 to-rose-600',
    initials: 'F',
  },
};

export default function Dashboard(): React.ReactElement {
  const { completionPercentage, isProfileComplete, profileData, loading } =
    useProfile();

  const [currentPersona, setCurrentPersona] = useState<VoicePersona>('male');

  useEffect(() => {
    api<{ settings: { voice_persona?: string } }>('/api/accounts/settings/')
      .then((data) => {
        const persona = data.settings?.voice_persona;
        if (persona && persona in PERSONA_META) {
          setCurrentPersona(persona as VoicePersona);
        }
      })
      .catch(() => {});
  }, []);

  const profileExists = profileData !== null;

  const { heading, description, linkText, linkHref } = (() => {
    if (!profileExists) {
      return {
        heading: 'Create your profile',
        description:
          'Create your profile to proceed with personalized recommendations, Stream & Subject Selection, and more.',
        linkText: 'Create your profile',
        linkHref: '/profile/personal',
      };
    }
    if (!isProfileComplete) {
      return {
        heading: 'View/Edit your profile',
        description:
          'Your profile is partially complete. Fill in the remaining sections to unlock the best recommendations.',
        linkText: 'View/Edit your profile',
        linkHref: '/profile/personal',
      };
    }
    return {
      heading: 'View/Edit your profile',
      description:
        'Your profile is completed ! \n You can proceed to Stream & Subject Selection and explore personalized recommendations.',
      linkText: 'View/Edit your profile',
      linkHref: '/profile/personal',
    };
  })();

  const renderCompleteProfile = (): React.ReactElement => {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-4 md:gap-6 md:p-6 lg:flex-row lg:gap-8 lg:p-8">
        <div className="text-center lg:text-left">
          {loading ? (
            <div className="h-14 w-24 animate-pulse rounded bg-neutral-200" />
          ) : (
            <span className="mb-2 bg-linear-to-r from-red-500 via-blue-500 via-indigo-500 via-pink-500 via-purple-500 to-teal-400 bg-clip-text text-4xl font-semibold text-transparent md:text-5xl">
              {completionPercentage}%
            </span>
          )}
          <Label size="sm" className="block">
            of your profile is complete
          </Label>
        </div>
        <div className="text-center lg:text-left">
          {/* <Heading level={3} className="font-extrabold">
            {heading}
          </Heading> */}
          <Label size="md" className="block whitespace-pre-line">
            {description}
          </Label>
          <Link href={linkHref} className="btn-secondary mt-4 inline-block">
            {linkText}
          </Link>

          <Label size="sm" className="mt-3 block text-neutral-500">
            Please complete your profile details carefully, this helps me
            understand you better and ensures that your results are as accurate &
            personalized as possible.
          </Label>
        </div>
        <div className="flex w-full justify-center">
          <Image
            src={imgDashboardGraphic}
            alt="Dashboard Graphic"
            className="h-auto w-full max-w-sm lg:max-w-5/12"
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {renderCompleteProfile()}

      {/* Select Your Counsellor Voice quick-link */}
      <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-neutral-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br ${PERSONA_META[currentPersona].gradient} text-xs font-bold tracking-wider text-white shadow ring-2 ring-white`}
            >
              {PERSONA_META[currentPersona].initials}
            </div>
            <div>
              <Label size="md" className="font-semibold text-neutral-900">
                Select Your Counsellor Voice
              </Label>
              <br />
              <Label size="sm" className="text-neutral-500">
                Currently set to{' '}
                <span className="font-medium text-neutral-700">
                  {PERSONA_META[currentPersona].label}
                </span>
              </Label>
            </div>
          </div>
          <Link
            href="/settings"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            Change Voice
          </Link>
        </div>
      </div>
    </>
  );
}
