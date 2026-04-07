'use client';

import React, { useState, useEffect } from 'react';
import DynamicForm from '@/app/_components/dynamic-form/DynamicForm';
import Tabs from '@/app/(saas)/profile/_components/Tabs';
import { getProfileData } from '@/app/(saas)/profile/lib/api';
import { SubmitHandler } from 'react-hook-form';
import api from '@/lib/api';
import { useToast } from '@/app/_components/Toast';
import { useRouter } from 'next/navigation';
import { parseFormLocationData } from '@/lib/utils/location-parser';
import { reconstructFormLocationData } from '@/lib/utils/form-data-transformer';
import {
  personalFieldDefs as fieldDefs,
  personalLayout as layout,
} from '@/app/(saas)/profile/_config/fieldDefinitions';
import Instructions from '@/app/(saas)/profile/_components/Instructions';
import ResumeUploader from '@/app/_components/ResumeUploader';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';

const PersonalDetailsForm: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { rawApiResponse, loading, error, refetch } = useProfile();
  const [parsedResumeData, setParsedResumeData] = useState<any>(null);
  const [formDefaults, setFormDefaults] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const transformedResponse = React.useMemo(
    () =>
      reconstructFormLocationData(
        (rawApiResponse ?? {}) as Record<string, unknown>
      ),
    [rawApiResponse]
  );
  const defaultValues = transformedResponse as Record<string, unknown>;

  const onSubmit: SubmitHandler<Record<string, unknown>> = async (_data) => {
    try {
      setIsSubmitting(true);
      // Parse formatted city strings to extract city, state, country
      const parsedData = parseFormLocationData(_data);

      console.log('Submitting personal details:', parsedData); // Debug log

      // Show loading toast
      addToast('Updating profile...', { type: 'info' });

      // Fetch latest profile data to ensure we have the most recent data
      const latestData = await getProfileData();
      const existingProfile =
        ((latestData?.profile as Record<string, unknown>)?.profile as Record<
          string,
          unknown
        >) || {};

      console.log('Existing profile data:', existingProfile); // Debug log

      const educational = existingProfile.educational ?? {};
      const extraCurricular = existingProfile.extraCurricular ?? {};
      const additional = existingProfile.additional ?? {};
      const professional = existingProfile.professional ?? {};

      const payload = {
        profile: {
          personalDetails: parsedData,
          professional: professional,
          additional: additional,
          extraCurricular: extraCurricular,
          educational: educational,
        },
      };

      console.log('Sending update payload:', payload); // Debug log

      const response = await api('/api/profiles/update/', {
        method: 'POST',
        body: payload,
      });

      console.log('Update response:', response); // Debug log

      if (response['message'] === 'Profile updated successfully.') {
        // Refetch profile data to update the context
        await refetch();
      } else {
        addToast('Failed to update profile. Please try again.', {
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'An error occurred while updating your profile';
      addToast(message, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!parsedResumeData?.personal) return;

    const p = parsedResumeData.personal;

    setFormDefaults((prev) => ({
      ...prev,
      firstName: p.first_name ?? prev.firstName,
      lastName: p.last_name ?? prev.lastName,
      phoneNumber: p.phone ?? prev.phoneNumber,
      city: p.city ?? prev.city,
      citizenship: p.citizenship ?? prev.citizenship,
      gender: p.gender ?? prev.gender,
      dob: p.dob ?? prev.dob,
      addressLine: p.address ?? prev.addressLine,
    }));
  }, [parsedResumeData]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Instructions />
        <Tabs />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading your profile data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <Instructions />
        <Tabs />
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
  }

  // Extract personal details from the nested structure
  let personalDetails: Record<string, unknown> = {};

  if (
    defaultValues &&
    typeof defaultValues.profile === 'object' &&
    defaultValues.profile !== null
  ) {
    const profileObj = defaultValues.profile as Record<string, unknown>;

    if (typeof profileObj.profile === 'object' && profileObj.profile !== null) {
      const nestedProfile = profileObj.profile as Record<string, unknown>;

      if (
        typeof nestedProfile.personalDetails === 'object' &&
        nestedProfile.personalDetails !== null
      ) {
        personalDetails = nestedProfile.personalDetails as Record<
          string,
          unknown
        >;
      }
    }
  }

  console.log('Personal details for form:', personalDetails); // Debug log

  return (
    <div className="flex flex-col gap-4">
      <Instructions />
      <ResumeUploader onParsed={setParsedResumeData} />
      <Tabs />
      <DynamicForm
        key={JSON.stringify(formDefaults)}
        fieldDefs={fieldDefs}
        layout={layout}
        onSubmit={onSubmit}
        defaultValues={{
          ...personalDetails,
          ...formDefaults,
        }}
        formClassName="space-y-6"
        buttonName="Add Educational Details"
        showSaveButton={{ showSave: true, href: '/profile/educational/edit' }}
        isSubmitting={isSubmitting}
        onSaveOnly={() => {
          addToast('Personal details saved successfully!', { type: 'success' });
        }}
        onSaveAndNavigate={() => {
          addToast(
            'Personal details saved! Navigating to educational details...',
            { type: 'success' }
          );
          setTimeout(() => {
            router.push('/profile/educational/edit');
          }, 500);
        }}
      />
    </div>
  );
};

export default PersonalDetailsForm;
