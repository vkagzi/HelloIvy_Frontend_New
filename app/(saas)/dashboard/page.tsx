'use client';

import React from 'react';
import Image from 'next/image';
import imgDashboardGraphic from '@/assets/images/dashboard-graphic.png';
import Link from 'next/link';
import { Heading, Label } from '@/app/_components/Typography';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';

export default function Dashboard(): React.ReactElement {
  const {
    completionPercentage,
    isProfileComplete,
    profileData,
    loading,
  } = useProfile();

  const profileExists = profileData !== null;

  const { heading, description, linkText, linkHref } = (() => {
    if (!profileExists) {
      return {
        heading: 'Create your profile',
        description:
          'Create your profile to proceed with personalized recommendations, domain discovery, and more.',
        linkText: 'Create',
        linkHref: '/profile/personal',
      };
    }
    if (!isProfileComplete) {
      return {
        heading: 'Add more details to your profile',
        description:
          'Your profile is partially complete. Fill in the remaining sections to unlock the best recommendations.',
        linkText: 'Edit',
        linkHref: '/profile/personal',
      };
    }
    return {
      heading: 'View your profile',
      description:
        'Your profile is complete! You can proceed to domain discovery and explore personalized recommendations.',
      linkText: 'View',
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
            <span className="mb-2 bg-linear-to-r from-red-500 via-pink-500 via-purple-500 via-blue-500 via-indigo-500 to-teal-400 bg-clip-text text-4xl font-semibold text-transparent md:text-5xl">
              {completionPercentage}%
            </span>
          )}
          <Label size="sm" className="block">
            of your profile is complete
          </Label>
        </div>
        <div className="text-center lg:text-left">
          <Heading level={3} className="font-extrabold">
            {heading}
          </Heading>
          <Label size="sm" className="block">
            {description}
          </Label>
          <Link href={linkHref} className="btn-secondary mt-4 inline-block">
            {linkText}
          </Link>
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

  return <>{renderCompleteProfile()}</>;
}
