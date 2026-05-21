'use client';

import React from 'react';
import Image from 'next/image';
import imgIcon from '@/assets/images/iconGIF.gif';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { FiIcon } from '@/app/_components/Icons';
import Button from '@/app/_components/Button';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';
import { useUserAuth } from '@/app/_hooks/useUserAuth';

type InfoItemProps = {
  icon: string;
  value: string | undefined;
  showDivider?: boolean;
};

const InfoItem: React.FC<InfoItemProps> = ({
  icon,
  value,
  showDivider = true,
}) => {
  const displayValue =
    typeof value === 'string' && value ? value : 'Not provided';

  return (
    <>
      <span className="flex items-center gap-2">
        <FiIcon name={icon} className="flex h-3 w-3 items-center text-neutral-500" />
        <Paragraph size="xs" className="text-neutral-900">
          {displayValue}
        </Paragraph>
      </span>
      {showDivider && <span className="hidden text-neutral-300 sm:inline">|</span>}
    </>
  );
};

const ProfileHeaderSkeleton: React.FC = () => (
  <section className="flex flex-col">
    <div className="flex items-center gap-6">
      <div className="h-20 w-20 animate-pulse rounded-full bg-neutral-200" />
      <div className="flex flex-col gap-2">
        <div className="h-6 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-64 animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
  </section>
);

const ProfileHeaderView: React.FC = () => {
  const { personalDetails: defaultValues, loading } = useProfile();
  const { userDetails } = useUserAuth();

  if (loading) {
    return <ProfileHeaderSkeleton />;
  }

  const getStringValue = (value: unknown): string | undefined => {
    return typeof value === 'string' && value ? value : undefined;
  };

  const formatDob = (value: unknown): string | undefined => {
    const str = getStringValue(value);
    if (!str) return undefined;
    // Format YYYY-MM-DD to DD/MM/YYYY
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    return str;
  };

  const getFullName = (): string => {
    const { first_name, last_name, name } = userDetails;
    if (first_name || last_name) {
      return `${first_name} ${last_name}`.trim();
    }
    return name || 'Not Provided';
  };

  const profileInfo = [
    { icon: 'envelope', value: userDetails.email || undefined },
    { icon: 'phone-call', value: getStringValue(defaultValues.phoneNumber) },
    { icon: 'user', value: getStringValue(defaultValues.gender) },
    { icon: 'cake-birthday', value: formatDob(defaultValues.dob) },
    { icon: 'marker', value: getStringValue(defaultValues.addressline) },
  ];

  return (
    <section className="flex flex-col">
      <div className="flex items-center gap-6">
        <div className="relative h-20 w-20">
          <Image
            src={imgIcon}
            alt="Profile"
            width={80}
            height={80}
            className="rounded-full border border-neutral-200 object-cover"
            priority
            unoptimized
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Heading level={4} className="font-extrabold text-neutral-900">
              {getFullName()}
            </Heading>

          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-neutral-900">
            {profileInfo.map((info, index) => (
              <InfoItem
                key={info.icon}
                icon={info.icon}
                value={info.value}
                showDivider={index < profileInfo.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileHeaderView;
