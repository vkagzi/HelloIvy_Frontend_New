'use client';

import React from 'react';
import DynamicForm from '@/app/_components/dynamic-form/DynamicForm';
import Tabs from '../../_components/Tabs';
import { useToast } from '@/app/_components/Toast';
import { SubmitHandler } from 'react-hook-form';
import api from '@/lib/api';
import { getProfileData } from '../../lib/api';
import Instructions from '../../_components/Instructions';
import { additionalFieldDefs as fieldDefs, additionalLayout as layout } from '../../_config/fieldDefinitions';
import { hasProfileSection } from '../../utils/utils';
import { useRouter } from 'next/navigation';
import { useProfile } from '../../_context/ProfileContext';

const AdditionalFormDetails: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { rawApiResponse } = useProfile();
  const defaultValues = (rawApiResponse ?? {}) as Record<string, unknown>;

  const onSubmit: SubmitHandler<Record<string, unknown>> = async (_data) => {
    try {
      // Fetch latest profile data to ensure we have the most recent data
      const latestData = await getProfileData();
      const existingProfile =
        ((latestData?.profile as Record<string, unknown>)?.profile as Record<
          string,
          unknown
        >) || {};

      const educational = existingProfile.educational ?? {};
      const extraCurricular = existingProfile.extraCurricular ?? {};
      const personalDetails = existingProfile.personalDetails ?? {};
      const professional = existingProfile.professional ?? {};

      const response = await api('/api/profiles/update/', {
        method: 'POST',
        body: {
          profile: {
            educational: educational,
            additional: _data,
            professional: professional,
            personalDetails: personalDetails,
            extraCurricular: extraCurricular,
          },
        },
      });
      if (response['message'] === 'Profile updated successfully.') {
        router.push('/profile/personal');
      } else {
        addToast('Failed to update profile.', { type: 'error' });
      }
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'An unknown error occurred';
      addToast(message, { type: 'error' });
    }
  };
  // Extract additional details from the nested structure
  let additionalDetails: Record<string, unknown> = {};

  if (
    defaultValues &&
    typeof defaultValues.profile === 'object' &&
    defaultValues.profile !== null
  ) {
    const profileObj = defaultValues.profile as Record<string, unknown>;

    if (typeof profileObj.profile === 'object' && profileObj.profile !== null) {
      const nestedProfile = profileObj.profile as Record<string, unknown>;

      if (
        typeof nestedProfile.additional === 'object' &&
        nestedProfile.additional !== null
      ) {
        additionalDetails = nestedProfile.additional as Record<string, unknown>;
      }
    }
  }

  console.log('Additional details for form:', additionalDetails); // Debug log

  return (
    <div className="flex flex-col gap-4">
      <Instructions />
      <Tabs />
      <DynamicForm
        fieldDefs={fieldDefs}
        defaultValues={additionalDetails}
        layout={layout}
        onSubmit={onSubmit}
        formClassName="space-y-6"
        buttonName="Complete Profile"
        showSaveButton={
          hasProfileSection(defaultValues, 'additional')
            ? { showSave: true, href: '/profile/personal' }
            : { showSave: false }
        }
      />
    </div>
  );
};

export default AdditionalFormDetails;
