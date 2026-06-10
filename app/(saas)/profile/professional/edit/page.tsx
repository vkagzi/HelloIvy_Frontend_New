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
import LinkedInImporter from '@/app/_components/LinkedInImporter';
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
  const { rawApiResponse, refetch, parsedTranscriptData, setParsedTranscriptData } = useProfile();
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
    
    // Normalize dates to YYYY-MM-DD for the backend/Zod validation
    if (Array.isArray(parsedData.experiences)) {
      parsedData.experiences = (parsedData.experiences as any[]).map((exp) => {
        const normalize = (d: any) => {
          if (!d) return '';
          // If already YYYY-MM-DD, return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
          // If DD/MM/YYYY, convert to YYYY-MM-DD
          const match = String(d).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
          // Fallback to JS Date parsing
          const date = new Date(d);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
          return d;
        };
        return {
          ...exp,
          startDate: normalize(exp.startDate),
          endDate: normalize(exp.endDate),
        };
      });
    }

    console.log('Professional form data being submitted:', parsedData);
    try {
      setIsSubmitting(true);
      // Fetch latest profile data to ensure we have the most recent data
      const latestData = await getProfileData();
      
      // Robust extraction: backend returns {"profile": {"profile": {...}}} or {"profile": {...}}
      // depending on whether it was already unwrapped or not.
      let existingProfile: Record<string, any> = {};
      const firstLevel = latestData?.profile as any;
      if (firstLevel) {
        if (firstLevel.profile && typeof firstLevel.profile === 'object') {
          existingProfile = firstLevel.profile;
        } else {
          existingProfile = firstLevel;
        }
      }

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
        // Clear only professional scan data so we don't wipe out other tabs
        setParsedTranscriptData((prev: any) => {
          if (!prev) return prev;
          const next = { ...prev };
          delete next.professional;
          return next;
        });
        setFormDefaults({});
        await refetch();
        addToast('Professional details saved successfully!', { type: 'success' });
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

    // PERFORM A CLEAN RENEWAL: Clear existing defaults to avoid data pollution from previous scans
    setFormDefaults({
      experiences: experiences.map((exp: any) => ({
        experienceType: exp.experienceType ?? exp.experience_type ?? "",
        experienceTypeOther: exp.experienceTypeOther ?? exp.experience_type_other ?? "",
        industrySector: exp.industrySector ?? exp.industry ?? "",
        industrySectorOther: exp.industrySectorOther ?? exp.industry_sector_other ?? exp.industry_other ?? "",
        currentEmployer: exp.currentEmployer ?? exp.employerName ?? exp.company ?? "",
        city: exp.city ?? "",
        durationValue: exp.durationValue ?? exp.duration ?? "",
        durationUnit: exp.durationUnit ?? exp.unit ?? "Months",
        startDate: exp.startDate ?? exp.start_date ?? "",
        endDate: exp.endDate ?? exp.end_date ?? "",
        jobTitle: exp.jobTitle ?? exp.title ?? "",
        responsibilities: exp.responsibilities ?? "",
        achievements: exp.achievements ?? "",
      })),
      ...(typeof professional === 'object' && !Array.isArray(professional) ? professional : {})
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

  // Only load saved server data when there is NO active resume scan
  useEffect(() => {
    if (parsedTranscriptData?.professional) {
      // A scan is active — do not overwrite with old server data
      return;
    }
    if (Object.keys(professionalDetails).length > 0) {
      setFormDefaults(professionalDetails as Record<string, unknown>);
    }
  }, [JSON.stringify(professionalDetails), parsedTranscriptData]); // eslint-disable-line react-hooks/exhaustive-deps

  console.log('Professional details for form:', professionalDetails); // Debug log

  return (
    <div className="flex flex-col gap-4">
      <Instructions />
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <ResumeUploader />
        <LinkedInImporter />
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
          // Toast and reload handled by onSubmit
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
