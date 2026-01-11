'use client';

import React from 'react';
import { ProfileProvider } from '@/app/(saas)/profile/_context/ProfileContext';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <ProfileProvider>{children}</ProfileProvider>;
}
