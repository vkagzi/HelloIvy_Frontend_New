'use client';

import React, { useState, useEffect } from 'react';
import DynamicForm from '@/app/_components/dynamic-form/DynamicForm';
import { useRouter } from 'next/navigation';
import { SubmitHandler } from 'react-hook-form';
import { useToast } from '@/app/_components/Toast';
import api from '@/lib/api';
import { getProfileData } from '@/app/(saas)/profile/lib/api';
import { parseFormLocationData } from '@/lib/utils/location-parser';
import { reconstructFormLocationData } from '@/lib/utils/form-data-transformer';
import Instructions from '@/app/(saas)/profile/_components/Instructions';
import ResumeUploader from '@/app/_components/ResumeUploader';
import Tabs from '@/app/(saas)/profile/_components/Tabs';
import {
  professionalFieldDefs as fieldDefs,
  professionalLayout as layout,
} from '@/app/(saas)/profile/_config/fieldDefinitions';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';

const ProfessionalFormDetails: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const formRef = React.useRef<ReturnType<
    typeof import('react-hook-form').useForm
  > | null>(null);
  const { rawApiResponse, refetch, parsedTranscriptData } = useProfile();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formDefaults, setFormDefaults] = useState<Record<string, unknown>>({});
  // Reconstruct formatted location data for display
  const transformedResponse = React.useMemo(
    () =>
      reconstructFormLocationData(
        (rawApiResponse ?? {}) as Record<string, unknown>
      ),
    [rawApiResponse]
  );
  const defaultValues = transformedResponse as Record<string, unknown>;

  const onSubmit: SubmitHandler<Record<string, unknown>> = async (_data) => {
    // Parse formatted city strings to extract city, state, country
    const parsedData = parseFormLocationData(_data);
    console.log('Professional form data being submitted:', parsedData);
    try {
      setIsSubmitting(true);
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
        // Refetch profile data to update the context
        await refetch();
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
    } finally {
      setIsSubmitting(false);
    }
  };

  

  useEffect(() => {
    if (!parsedTranscriptData?.professional) return;
    
    // Support both direct array and nested experiences array
    const professional = parsedTranscriptData.professional;
    const experiences = Array.isArray(professional) ? professional : (professional.experiences || []);
    
    if (!experiences.length) return;

    setFormDefaults((prev) => {
      const existing = Array.isArray(prev.experiences) ? prev.experiences : [];
      const mapped = experiences.map((exp: any, idx: number) => {
        const existExp = existing[idx] || {};
        return {
          ...existExp,
          experienceType: exp.experienceType ?? exp.experience_type ?? existExp.experienceType,
          industrySector: exp.industrySector ?? exp.industry ?? existExp.industrySector,
          currentEmployer: exp.currentEmployer ?? exp.employerName ?? exp.company ?? existExp.currentEmployer,
          city: exp.city ?? existExp.city,
          durationValue: exp.durationValue ?? exp.duration ?? existExp.durationValue,
          durationUnit: exp.durationUnit ?? exp.unit ?? existExp.durationUnit,
          startDate: exp.startDate ?? exp.start_date ?? existExp.startDate,
          endDate: exp.endDate ?? exp.end_date ?? existExp.endDate,
          jobTitle: exp.jobTitle ?? exp.title ?? existExp.jobTitle,
          responsibilities: exp.responsibilities ?? existExp.responsibilities,
          achievements: exp.achievements ?? existExp.achievements,
        };
      });

      return {
        ...prev,
        ...professional, // merge top-level if any
        experiences: mapped,
      };
    });
  }, [parsedTranscriptData]);



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
      <div className="mt-2">
        <ResumeUploader />
      </div>
      <Tabs />
      <DynamicForm
        key={JSON.stringify(formDefaults)}
        defaultValues={{
          ...professionalDetails,
          ...formDefaults,
        }}
        fieldDefs={fieldDefs}
        layout={layout}
        onSubmit={async (values) => {
          await onSubmit(values);
        }}
        formClassName="space-y-6"
        buttonName="Add Extra Curricular Details"
        onFormInit={(form) => {
          formRef.current = form;
        }}
        showSaveButton={{
          showSave: true,
          href: '/profile/extra-curricular/edit',
        }}
        isSubmitting={isSubmitting}
        onSaveOnly={() => {
          addToast('Professional details saved successfully!', {
            type: 'success',
          });
        }}
        onSaveAndNavigate={() => {
          addToast(
            'Professional details saved! Navigating to extra-curricular details...',
            { type: 'success' }
          );
          router.push('/profile/extra-curricular/edit');
        }}
      />
    </div>
  );
};

export default ProfessionalFormDetails;
