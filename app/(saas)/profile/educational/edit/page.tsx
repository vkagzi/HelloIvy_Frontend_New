'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import ResumeUploader from '@/app/_components/ResumeUploader';
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
  const { rawApiResponse, refetch, personalDetails } = useProfile();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // Reconstruct formatted location data for display
  const transformedResponse = React.useMemo(
    () =>
      reconstructFormLocationData(
        (rawApiResponse ?? {}) as Record<string, unknown>
      ),
    [rawApiResponse]
  );
  const defaultValues = transformedResponse as Record<string, unknown>;
  const [parsedResumeData, setParsedResumeData] = useState<any>(null);
  const [formDefaults, setFormDefaults] = useState<Record<string, unknown>>({});
  const [fieldDefs, setFieldDefs] = useState<FieldDefinition[]>(fieldDefss);
  const prevAcademicLevelRef = useRef<string | undefined>(undefined);

  // Extract birth year from personalDetails.dob to constrain startYear options
  const birthYear = React.useMemo(() => {
    const dob = (personalDetails as Record<string, unknown>)?.dob as
      | string
      | undefined;
    if (!dob) return null;
    // DD/MM/YYYY format
    const ddmmyyyy = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) return parseInt(ddmmyyyy[3], 10);
    // YYYY-MM-DD (ISO) format
    const yyyymmdd = dob.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (yyyymmdd) return parseInt(yyyymmdd[1], 10);
    // Fallback: Date constructor
    const parsed = new Date(dob);
    return isNaN(parsed.getTime()) ? null : parsed.getFullYear();
  }, [personalDetails]);

  const detectYear = (startYear?: number) => {
    if (!startYear) return null;

    const currentYear = new Date().getFullYear();

    const diff = currentYear - startYear;

    if (diff < 1 || diff > 5) return null;

    return `Year ${diff}`;
  };

  useEffect(() => {
    if (!parsedResumeData?.personal) return;

    const p = parsedResumeData.personal;

    setFormDefaults((prev) => ({
      ...prev,

      academicLevel: p.degree ? 'College/Undergraduate' : prev.academicLevel,

      institutionName: p.institution ?? prev.institutionName,
      degree: p.degree ?? prev.degree,
      major: p.major ?? prev.major,
      score: p.cgpa ?? prev.score,
      gradeLevel: detectYear(p.start_year) ?? prev.gradeLevel,
    }));
  }, [parsedResumeData]);

  // Apply DOB-based year lower bounds: school yearOfCompletion >= DOB+1, college startYear >= DOB+10
  React.useEffect(() => {
    if (!birthYear) return;
    setFieldDefs((prev) =>
      prev.map((field) => {
        if (field.id === 'yearOfCompletion') {
          // console.log(
          //   `Applying DOB-based constraint to yearOfCompletion: birthYear=${birthYear}, minYear=${birthYear + 1}`
          // );
          return { ...field, minYear: birthYear + 1 };
        }
        if (field.id === 'startYear') {
          return {
            ...field,
            options: (field.options ?? []).filter(
              (y) => parseInt(y, 10) >= birthYear + 10
            ),
          };
        }
        return field;
      })
    );
  }, [birthYear]);

  const UG_PG_LEVELS = [
    'College/Undergraduate',
    'Postgraduate',
    'Working/Completed College',
  ];

  const SCHOOL_LEVELS = ['High School (8th–12th grade)'];

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
  const updateTestTypeOptions = useCallback(
    (academicLevel: string | undefined): void => {
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
    },
    []
  );

  const handleFormInit = useCallback(
    (
      form: import('react-hook-form').UseFormReturn<Record<string, unknown>>
    ): void => {
      // Initialize options based on existing academicLevel value
      const initialAcademicLevel = form.getValues('academicLevel') as
        | string
        | undefined;
      updateTestTypeOptions(initialAcademicLevel);

      // Watch for changes
      form.watch((values) => {
        const academicLevel = values.academicLevel as string | undefined;
        updateTestTypeOptions(academicLevel);
      });
    },
    [updateTestTypeOptions]
  );

  const onSubmit: SubmitHandler<Record<string, unknown>> = async (_data) => {
    try {
      setIsSubmitting(true);
      // Parse formatted city strings to extract city, state, country
      const parsedData = parseFormLocationData(_data);

      // Transform educational data to proper structure with year identifiers
      const transformedData = transformEducationalData(parsedData);

      // Build a clean educational object with only relevant keys.
      // Only the academic section matching the current academicLevel is included;
      // stale sections from a previous academicLevel selection are dropped.
      const academicLevel = transformedData.academicLevel as string | undefined;
      const sectionKey: Record<string, string> = {
        'High School (8th–12th grade)': 'highSchool',
        'College/Undergraduate': 'undergraduate',
        Postgraduate: 'postgraduate',
        'Working/Completed College': 'tenPlus',
      };
      const relevantSection = academicLevel
        ? sectionKey[academicLevel]
        : undefined;

      const cleanEducational: Record<string, unknown> = {
        academicLevel,
      };

      // Include gradeLevel for academic levels that support it
      const gradeLevelLevels = [
        'High School (8th–12th grade)',
        'College/Undergraduate',
        'Postgraduate',
      ];
      if (academicLevel && gradeLevelLevels.includes(academicLevel)) {
        if (transformedData.gradeLevel !== undefined) {
          cleanEducational.gradeLevel = transformedData.gradeLevel;
        }
      }

      // High-school-only fields
      if (academicLevel === 'High School (8th–12th grade)') {
        if (transformedData.hasCurrentGradeScores !== undefined) {
          cleanEducational.hasCurrentGradeScores =
            transformedData.hasCurrentGradeScores;
        }
      }

      // Build the section object: academic entries + courses/awards/testScores
      if (relevantSection) {
        const arrayKey =
          relevantSection === 'highSchool' ? 'grades' : 'degrees';
        const sectionObj: Record<string, unknown> = {};

        if (transformedData[relevantSection] !== undefined) {
          sectionObj[arrayKey] = transformedData[relevantSection];
        }

        // Nest courses, awards, and test scores inside the section
        const sharedKeys = ['courses', 'awards', 'testScores'];
        sharedKeys.forEach((key) => {
          if (transformedData[key] !== undefined) {
            sectionObj[key] = transformedData[key];
          }
        });

        cleanEducational[relevantSection] = sectionObj;
      }

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
            educational: cleanEducational,
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

  // Un-nest shared data from section object for form compatibility
  const sectionEntries = [
    'highSchool',
    'undergraduate',
    'postgraduate',
    'tenPlus',
  ] as const;
  for (const key of sectionEntries) {
    const sectionData = educationalDetails[key];
    if (
      sectionData &&
      typeof sectionData === 'object' &&
      !Array.isArray(sectionData)
    ) {
      const section = sectionData as Record<string, unknown>;
      const arrayKey = key === 'highSchool' ? 'grades' : 'degrees';
      if (section[arrayKey]) {
        educationalDetails[key] = section[arrayKey];
      }
      for (const sharedKey of ['courses', 'awards', 'testScores']) {
        if (section[sharedKey] !== undefined) {
          educationalDetails[sharedKey] = section[sharedKey];
        }
      }
    }
  }

  // Populate form defaults from existing educational data
  useEffect(() => {
    if (educationalDetails && Object.keys(educationalDetails).length > 0) {
      setFormDefaults((prev) => ({
        ...prev,
        ...educationalDetails,
      }));
    }
  }, [defaultValues]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to hash element (e.g. #standardised-test-score) after form renders
  useEffect(() => {
    const hash = window.location.hash?.slice(1);
    if (!hash) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Instructions />
      {/* <ResumeUploader onParsed={setParsedResumeData} /> */}
      <Tabs />
      <DynamicForm
        key={JSON.stringify(formDefaults)}
        defaultValues={formDefaults}
        fieldDefs={fieldDefs}
        layout={layout}
        onSubmit={onSubmit}
        onFormInit={handleFormInit}
        formClassName="space-y-6"
        buttonName="Add Professional Details"
        showSaveButton={{ showSave: true, href: '/profile/professional/edit' }}
        isSubmitting={isSubmitting}
        onSaveOnly={() => {
          addToast('Educational details saved successfully!', {
            type: 'success',
          });
        }}
        onSaveAndNavigate={() => {
          addToast(
            'Educational details saved! Navigating to professional details...',
            { type: 'success' }
          );
          router.push('/profile/professional/edit');
        }}
      />
    </div>
  );
};

export default EducationalDetailsForm;
