'use client';

import React from 'react';
import ProfileHeaderView from '@/app/(saas)/profile/_components/ProfileHeader';
import ProfileViewDetails from '@/app/(saas)/profile/_components/ProfileView';
import { ProfileDetailType, profileConfig } from '@/app/(saas)/profile/_config/profileConfig';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';

type ProfileData = Record<string, unknown>;

interface ProfileDetailTemplateProps {
  detailType: ProfileDetailType;
}

// Loading state component
const LoadingState: React.FC = () => (
  <div className="flex flex-col gap-6">
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    </div>
  </div>
);

// Error state component
const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="flex flex-col gap-6">
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <svg
          className="mx-auto mb-4 h-12 w-12 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="mb-2 text-lg font-semibold text-red-900">
          Error Loading Profile
        </h3>
        <p className="mb-4 text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  </div>
);

// Helper to get data from profile context based on detail type
const useProfileData = (detailType: ProfileDetailType): ProfileData => {
  const profile = useProfile();
  const config = profileConfig[detailType];

  // For extra-curricular, we need to combine data
  if (detailType === 'extra-curricular') {
    return {
      extraCurricular: profile.extraCurricularDetails ?? [],
      educational: profile.educationalDetails,
    };
  }

  // Get the primary data for this section
  const contextKey = config.contextKey;
  return profile[contextKey] as ProfileData;
};

const ProfileDetailTemplate: React.FC<ProfileDetailTemplateProps> = ({
  detailType,
}) => {
  const { loading, error } = useProfile();
  const defaultValues = useProfileData(detailType);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <ProfileHeaderView />
      <ProfileViewDetails defaultValues={defaultValues} />
    </div>
  );
};

export default ProfileDetailTemplate;
