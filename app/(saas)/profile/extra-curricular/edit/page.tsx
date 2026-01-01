'use client';

import React from 'react';
import DynamicForm from '@/app/_components/dynamic-form/DynamicForm';
import Tabs from '../../_components/Tabs';
import { useToast } from '@/app/_components/Toast';
import { getProfileData } from '../../lib/api';
import { SubmitHandler } from 'react-hook-form';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Instructions from '../../_components/Instructions';
import { extraCurricularFieldDefs as fieldDefs, getExtracurricularTitle } from '../../_config/fieldDefinitions';
import { hasProfileSection } from '../../utils/utils';
import { useProfile } from '../../_context/ProfileContext';

const ExtraCurricularFormDetails: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { rawApiResponse } = useProfile();
  const defaultValues = (rawApiResponse ?? {}) as Record<string, unknown>;
  const academicLevel =
    typeof defaultValues.profile === 'object' &&
    defaultValues.profile !== null &&
    typeof (defaultValues.profile as { profile?: { educational?: unknown } })
      .profile?.educational === 'object'
      ? (
          (
            defaultValues.profile as {
              profile?: { educational?: { academicLevel?: unknown } };
            }
          ).profile?.educational as {
            academicLevel?: unknown;
          }
        )?.academicLevel
      : undefined;
  const sectionTitle = getExtracurricularTitle(
    academicLevel as string[] | string
  );
  const layout = [
    {
      type: 'heading',
      content: sectionTitle,
    },
    {
      type: 'fieldset',
      fields: [
        'activityType',
        'duration',
        'positionHeld',
        'awardsCertifications',
        'description',
        'city',
        'country',
      ],
      name: 'extraCurricular',
      repeatable: true,
      repeatable_option: {
        add: '+ Add Activity',
        show_default: 1,
        min: 1,
      },
    },
  ];

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
      const personalDetails = existingProfile.personalDetails ?? {};
      const additional = existingProfile.additional ?? {};
      const professional = existingProfile.professional ?? {};

      const extraCurricular =
        typeof _data === 'object' &&
        _data !== null &&
        'extraCurricular' in _data
          ? (_data.extraCurricular as unknown)
          : [];

      const response = await api('/api/profiles/update/', {
        method: 'POST',
        body: {
          profile: {
            extraCurricular: extraCurricular,
            professional: professional,
            personalDetails: personalDetails,
            additional: additional,
            educational: educational,
          },
        },
      });
      if (response['message'] === 'Profile updated successfully.') {
        router.push('/profile/additional/edit');
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

  // Extract extra-curricular details from the nested structure
  let extraCurricularData: unknown[] = [];

  if (
    defaultValues &&
    typeof defaultValues.profile === 'object' &&
    defaultValues.profile !== null
  ) {
    const profileObj = defaultValues.profile as Record<string, unknown>;

    if (typeof profileObj.profile === 'object' && profileObj.profile !== null) {
      const nestedProfile = profileObj.profile as Record<string, unknown>;

      if (Array.isArray(nestedProfile.extraCurricular)) {
        extraCurricularData = nestedProfile.extraCurricular;
      }
    }
  }

  console.log('Extra-curricular data for form:', extraCurricularData); // Debug log

  return (
    <div className="flex flex-col gap-4">
      <Instructions />
      <Tabs />
      <DynamicForm
        defaultValues={{
          extraCurricular: extraCurricularData,
        }}
        fieldDefs={fieldDefs}
        layout={layout}
        onSubmit={(values) => {
          onSubmit(values);
        }}
        buttonName="Add Additional Details"
        formClassName="space-y-6"
      />
    </div>
  );
};

export default ExtraCurricularFormDetails;
