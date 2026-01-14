'use client';

import React from 'react';
import DynamicForm from '@/app/_components/dynamic-form/DynamicForm';
import { useRouter } from 'next/navigation';
import { SubmitHandler } from 'react-hook-form';
import { useToast } from '@/app/_components/Toast';
import api from '@/lib/api';
import { getProfileData } from '@/app/(saas)/profile/lib/api';
import { parseFormLocationData } from '@/lib/utils/location-parser';
import { reconstructFormLocationData } from '@/lib/utils/form-data-transformer';
import Instructions from '@/app/(saas)/profile/_components/Instructions';
import Tabs from '@/app/(saas)/profile/_components/Tabs';
import { professionalFieldDefs as fieldDefs, professionalLayout as layout } from '@/app/(saas)/profile/_config/fieldDefinitions';
import {
  // getSectionCompletionStatus,
  hasProfileSection,
} from '@/app/(saas)/profile/utils/utils';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';

const ProfessionalFormDetails: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const formRef = React.useRef<ReturnType<
    typeof import('react-hook-form').useForm
  > | null>(null);
  const { rawApiResponse, refetch } = useProfile();
  // Reconstruct formatted location data for display
  const transformedResponse = React.useMemo(
    () => reconstructFormLocationData((rawApiResponse ?? {}) as Record<string, unknown>),
    [rawApiResponse]
  );
  const defaultValues = transformedResponse as Record<string, unknown>;

  const onSubmit: SubmitHandler<Record<string, unknown>> = async (_data) => {
    // Parse formatted city strings to extract city, state, country
    const parsedData = parseFormLocationData(_data);
    console.log('Professional form data being submitted:', parsedData);
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
      const additional = existingProfile.additional ?? {};

      const response = await api('/api/profiles/update/', {
        method: 'POST',
        body: {
          profile: {
            professional: parsedData,
            personalDetails: personalDetails,
            additional: additional,
            extraCurricular: extraCurricular,
            educational: educational,
          },
        },
      });
      if (response['message'] === 'Profile updated successfully.') {
        addToast('Professional details saved successfully!', {
          type: 'success',
        });
        // Refetch profile data to update the context
        await refetch();
        router.push('/profile/extra-curricular/edit');
      } else {
        addToast('Failed to update profile.', { type: 'error' });
      }
    } catch (error) {
      console.error('Error saving professional data:', error);
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'An unknown error occurred';
      addToast(message, { type: 'error' });
    }
  };

  // Extract professional details from the nested structure
  let professionalDetails: Record<string, unknown> = {};

  if (
    defaultValues &&
    typeof defaultValues.profile === 'object' &&
    defaultValues.profile !== null
  ) {
    const profileObj = defaultValues.profile as Record<string, unknown>;

    if (typeof profileObj.profile === 'object' && profileObj.profile !== null) {
      const nestedProfile = profileObj.profile as Record<string, unknown>;

      if (
        typeof nestedProfile.professional === 'object' &&
        nestedProfile.professional !== null
      ) {
        professionalDetails = nestedProfile.professional as Record<
          string,
          unknown
        >;
      }
    }
  }

  console.log('Professional details for form:', professionalDetails); // Debug log

  return (
    <div className="flex flex-col gap-4">
      <Instructions />
      <Tabs />
      <DynamicForm
        defaultValues={professionalDetails}
        fieldDefs={fieldDefs}
        layout={layout}
        onSubmit={(values) => {
          onSubmit(values);
        }}
        formClassName="space-y-6"
        buttonName="Add Extra Curricular Details"
        onFormInit={(form) => {
          formRef.current = form;
        }}
        showSaveButton={{ showSave: false }}
      />
    </div>
  );
};

export default ProfessionalFormDetails;
