'use client';

import React, { useState, useRef, useCallback } from 'react';
import { FieldDefinition } from '@/app/utils/dynamicForm';
import DynamicForm from '@/app/_components/dynamic-form/DynamicForm';
import Tabs from '@/app/(saas)/profile/_components/Tabs';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/_components/Toast';
import { getProfileData } from '@/app/(saas)/profile/lib/api';
import { SubmitHandler } from 'react-hook-form';
import api from '@/lib/api';
import { parseFormLocationData } from '@/lib/utils/location-parser';
import { reconstructFormLocationData } from '@/lib/utils/form-data-transformer';
import { transformEducationalData } from '@/lib/utils/educational-data-transformer';
import Instructions from '@/app/(saas)/profile/_components/Instructions';
import {
  educationalFieldDefs as fieldDefss,
  educationalLayout as layout,
  schoolTestTypeOptions,
  ugPgTestTypeOptions,
} from '@/app/(saas)/profile/_config/fieldDefinitions';
import {
  // getSectionCompletionStatus,
  hasProfileSection,
} from '@/app/(saas)/profile/utils/utils';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';

const EducationalDetailsForm: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { rawApiResponse, refetch } = useProfile();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // Reconstruct formatted location data for display
  const transformedResponse = React.useMemo(
    () => reconstructFormLocationData((rawApiResponse ?? {}) as Record<string, unknown>),
    [rawApiResponse]
  );
  const defaultValues = transformedResponse as Record<string, unknown>;

  const [fieldDefs, setFieldDefs] = useState<FieldDefinition[]>(fieldDefss);
  const prevAcademicLevelRef = useRef<string | undefined>(undefined);

  const UG_PG_LEVELS = [
    'College/Undergraduate',
    'Postgraduate',
    'Working/Completed College',
  ];

  const SCHOOL_LEVELS = [
    'High School (9th–12th grade)',
  ];

  // Helper to get options based on academic level selected in the form
  const getTestTypeOptions = (academicLevel: string | undefined): string[] => {
    if (!academicLevel) {
      return [];
    }

    if (UG_PG_LEVELS.includes(academicLevel)) {
      return ugPgTestTypeOptions;
    }

    if (SCHOOL_LEVELS.includes(academicLevel)) {
      return schoolTestTypeOptions;
    }

    return [];
  };

  // Helper to update testType options based on academic level
  const updateTestTypeOptions = useCallback((academicLevel: string | undefined): void => {
    // Only update if the academic level actually changed
    if (prevAcademicLevelRef.current === academicLevel) {
      return;
    }
    prevAcademicLevelRef.current = academicLevel;

    const options = getTestTypeOptions(academicLevel);
    setFieldDefs((prev) =>
      prev.map((field) =>
        field.id === 'testType' ? { ...field, options } : field
      )
    );
  }, []);

  const handleFormInit = useCallback((
    form: import('react-hook-form').UseFormReturn<Record<string, unknown>>
  ): void => {
    // Initialize options based on existing academicLevel value
    const initialAcademicLevel = form.getValues('academicLevel') as string | undefined;
    updateTestTypeOptions(initialAcademicLevel);

    // Watch for changes
    form.watch((values) => {
      const academicLevel = values.academicLevel as string | undefined;
      updateTestTypeOptions(academicLevel);
    });
  }, [updateTestTypeOptions]);

  const onSubmit: SubmitHandler<Record<string, unknown>> = async (_data) => {
    try {
      setIsSubmitting(true);
      // Parse formatted city strings to extract city, state, country
      const parsedData = parseFormLocationData(_data);
      
      // Transform educational data to proper structure with year identifiers
      const transformedData = transformEducationalData(parsedData);

      // Fetch latest profile data to ensure we have the most recent data
      const latestData = await getProfileData();
      const existingProfile =
        ((latestData?.profile as Record<string, unknown>)?.profile as Record<
          string,
          unknown
        >) || {};

      const extraCurricular = existingProfile.extraCurricular ?? {};
      const personalDetails = existingProfile.personalDetails ?? {};
      const additional = existingProfile.additional ?? {};
      const professional = existingProfile.professional ?? {};

      const response = await api('/api/profiles/update/', {
        method: 'POST',
        body: {
          profile: {
            educational: transformedData,
            personalDetails: personalDetails,
            professional: professional,
            additional: additional,
            extraCurricular: extraCurricular,
          },
        },
      });
      if (response['message'] === 'Profile updated successfully.') {
        // Refetch profile data to update the context
        await refetch();
      } else {
        addToast('Failed to update profile.', { type: 'error' });
      }
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'An unknown error occurred';
      addToast(message, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract educational details from the nested structure
  let educationalDetails: Record<string, unknown> = {};

  if (
    defaultValues &&
    typeof defaultValues.profile === 'object' &&
    defaultValues.profile !== null
  ) {
    const profileObj = defaultValues.profile as Record<string, unknown>;

    if (typeof profileObj.profile === 'object' && profileObj.profile !== null) {
      const nestedProfile = profileObj.profile as Record<string, unknown>;

      if (
        typeof nestedProfile.educational === 'object' &&
        nestedProfile.educational !== null
      ) {
        educationalDetails = nestedProfile.educational as Record<
          string,
          unknown
        >;
      }
    }
  }

  console.log('Educational details for form:', educationalDetails); // Debug log

  return (
    <div className="flex flex-col gap-4">
      <Instructions />
      <Tabs />
      <DynamicForm
        defaultValues={educationalDetails}
        fieldDefs={fieldDefs}
        layout={layout}
        onSubmit={onSubmit}
        onFormInit={handleFormInit}
        formClassName="space-y-6"
        buttonName="Add Professional Details"
        showSaveButton={{ showSave: true, href: '/profile/professional/edit' }}
        isSubmitting={isSubmitting}
        onSaveOnly={() => {
          addToast('Educational details saved successfully!', { type: 'success' });
        }}
        onSaveAndNavigate={() => {
          addToast('Educational details saved! Navigating to professional details...', { type: 'success' });
          router.push('/profile/professional/edit');
        }}
      />
    </div>
  );
};

export default EducationalDetailsForm;
