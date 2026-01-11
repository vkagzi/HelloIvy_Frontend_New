'use client';

import React from 'react';
import { useParams, notFound } from 'next/navigation';
import ProfileDetailTemplate from '@/app/(saas)/profile/_components/ProfileDetailTemplate';
import {
  ProfileDetailType,
  isValidDetailType,
} from '@/app/(saas)/profile/_config/profileConfig';

const ProfileDetailPage: React.FC = () => {
  const params = useParams();
  const detailType = params?.detailType as string;

  // Validate the detail type
  if (!detailType || !isValidDetailType(detailType)) {
    notFound();
  }

  return <ProfileDetailTemplate detailType={detailType as ProfileDetailType} />;
};

export default ProfileDetailPage;
