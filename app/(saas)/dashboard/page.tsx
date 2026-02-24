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
    loading,
  } = useProfile();

  const renderCompleteProfile = (): React.ReactElement => {
    /**
     * three column layout
     * first column: dynamic percentage in gradient text, below that "of your profile is complete"
     * second column: "Complete your profile" heading with a description and a cta below it "View Profile"
     * third column: takes remaining space, centered graphic
     */
    return (
      <div className="flex flex-row items-center justify-center gap-8 p-8">
        <div className="">
          {loading ? (
            <div className="h-14 w-24 animate-pulse rounded bg-neutral-200" />
          ) : (
            <span className="mb-2 bg-linear-to-r from-red-500 via-pink-500 via-purple-500 via-blue-500 via-indigo-500 to-teal-400 bg-clip-text text-5xl font-semibold text-transparent">
              {completionPercentage}%
            </span>
          )}
          <Label size="sm" className="block">
            of your profile is complete
          </Label>
        </div>
        <div className="">
          <Heading level={3} className="font-extrabold">
            Complete your profile
          </Heading>
          <Label size="sm" className="block">
            Fill in your personal information, academic background, and goals to
            get personalized recommendations.
          </Label>
          <Link href="/profile/personal" className="btn-secondary mt-4">
            View Profile
          </Link>
        </div>
        <div className="flex w-full justify-center">
          <Image
            src={imgDashboardGraphic}
            alt="Dashboard Graphic"
            className="h-auto max-w-5/12"
          />
        </div>
      </div>
    );
  };

  return <>{renderCompleteProfile()}</>;
}
