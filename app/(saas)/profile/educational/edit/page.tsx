'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FieldDefinition } from '@/app/utils/dynamicForm';
import DynamicForm from '@/app/_components/dynamic-form/DynamicForm';
import Tabs from '@/app/(saas)/profile/_components/Tabs';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/_components/Toast';
import { useProfile } from '@/app/(saas)/profile/_context/ProfileContext';
import { getProfileData } from '@/app/(saas)/profile/lib/api';
import { SubmitHandler, UseFormReturn } from 'react-hook-form';
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

const EducationalDetailsForm: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { profileData, rawApiResponse, refetch, personalDetails, parsedTranscriptData } = useProfile();
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
  const [formDefaults, setFormDefaults] = useState<Record<string, unknown>>({});
  const [fieldDefs, setFieldDefs] = useState<FieldDefinition[]>(fieldDefss);
  const prevAcademicLevelRef = useRef<string | undefined>(undefined);
  const formRef = useRef<UseFormReturn<Record<string, unknown>> | null>(null);

  const UG_PG_LEVELS = [
    'Undergraduate',
    'Postgraduate',
    'Working Professional',
  ];
  const SCHOOL_LEVELS = ['High School (8th–12th grade)'];

  const getTestTypeOptions = (academicLevel: string | undefined): string[] => {
    // Combine all options to ensure everything is available (GRE, GMAT, AP, etc.)
    const allOptions = Array.from(new Set([...ugPgTestTypeOptions, ...schoolTestTypeOptions]));

    // Normalize order - common ones first
    const preferredOrder = ['SAT', 'ACT', 'GRE', 'GMAT', 'AP', 'TOEFL', 'IELTS', 'Executive Assessment', 'Others'];
    return allOptions.sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  };

  const updateTestTypeOptions = useCallback((academicLevel: string | undefined) => {
    if (prevAcademicLevelRef.current === academicLevel) return;
    prevAcademicLevelRef.current = academicLevel;
    const options = getTestTypeOptions(academicLevel);
    setFieldDefs((prev) =>
      prev.map((field) => (field.id === 'testType' ? { ...field, options } : field))
    );
  }, []);

  const handleFormInit = useCallback((form: UseFormReturn<Record<string, unknown>>) => {
    formRef.current = form;
    const initialAcademicLevel = form.getValues('academicLevel') as string | undefined;
    updateTestTypeOptions(initialAcademicLevel);
    form.watch((values) => {
      updateTestTypeOptions(values.academicLevel as string | undefined);
    });
  }, [updateTestTypeOptions]);

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
    if (!parsedTranscriptData?.educational && !parsedTranscriptData?.testScores) return;

    const e = parsedTranscriptData.educational || {};
    const rawLevel = (e.academicLevel || '').toLowerCase();

    setFormDefaults((prev) => {
      // Get latest values from the form to avoid overwriting user's manual selections (like selectedGrade)
      const currentValues = formRef.current ? formRef.current.getValues() : prev;
      const newDefaults = { ...currentValues };

      // PRIORITY: Use the academicLevel already set in the form by the user.
      // Only update academicLevel from AI if it returned something specific and confident.
      const currentFormLevel = (currentValues.academicLevel as string) || '';

      let detectedLevel = '';
      if (rawLevel.includes('high school') || rawLevel.includes('12th') || rawLevel.includes('10th') || rawLevel.includes('secondary')) {
        detectedLevel = 'High School (8th–12th grade)';
      } else if (rawLevel.includes('post') || rawLevel.includes('master') || rawLevel.includes('phd') || rawLevel.includes('mba')) {
        detectedLevel = 'Postgraduate';
      } else if (rawLevel.includes('work') || rawLevel.includes('prof') || rawLevel.includes('completed')) {
        detectedLevel = 'Working Professional';
      } else if (rawLevel.includes('college') || rawLevel.includes('under') || rawLevel.includes('bachelor') || (e.degree && rawLevel)) {
        detectedLevel = 'Undergraduate';
      }

      // Get target section from uploader if available
      const targetSectionFromUploader = (parsedTranscriptData as any)._target?.section;

      const academicLevel = targetSectionFromUploader 
        ? currentFormLevel 
        : (detectedLevel || currentFormLevel || 'High School (8th–12th grade)');
      newDefaults.academicLevel = academicLevel;

      const e = (parsedTranscriptData as any).educational || {};

      if (academicLevel === 'Undergraduate' || academicLevel === 'Postgraduate' || academicLevel === 'Working Professional') {
        // PRIORITY: If a target section was specified by the uploader (e.g. 'undergraduate_prereq'), use ONLY that.
        // Otherwise, fall back to the default sections for the current academicLevel.
        let targetSections: string[] = [];

        if (targetSectionFromUploader && ['undergraduate', 'undergraduate_prereq', 'postgraduate', 'tenPlus'].includes(targetSectionFromUploader)) {
          targetSections = [targetSectionFromUploader];
        } else {
          const section = academicLevel === 'Undergraduate' ? 'undergraduate' : academicLevel === 'Postgraduate' ? 'postgraduate' : 'tenPlus';
          targetSections = [section];
          if (academicLevel === 'Postgraduate' || academicLevel === 'Working Professional') {
            targetSections.push('undergraduate_prereq');
          }
        }

        for (const s of targetSections) {
          const existingArray = Array.isArray(currentValues[s]) ? currentValues[s] : [];
          const targetIdx = (parsedTranscriptData as any)._target?.index;
          const degreeIdx = typeof targetIdx === 'number' ? targetIdx : 0;

          const pathBase = `${s}.${degreeIdx}`;

          // Update form values directly for immediate UI feedback
          if (formRef.current) {
            if (e.institutionName !== undefined || e.schoolName !== undefined || e.institution !== undefined) {
              formRef.current.setValue(`${pathBase}.institutionName` as any, e.institutionName ?? e.schoolName ?? e.institution);
            }
            if (e.city !== undefined) formRef.current.setValue(`${pathBase}.city` as any, e.city);
            if (e.degree !== undefined) formRef.current.setValue(`${pathBase}.degree` as any, e.degree);
            if (e.major !== undefined || e.subject !== undefined) {
              formRef.current.setValue(`${pathBase}.major` as any, e.major ?? e.subject);
            }
            if (e.startYear !== undefined || e.start_year !== undefined) {
              formRef.current.setValue(`${pathBase}.startYear` as any, e.startYear ?? e.start_year);
            }
            if (e.endYear !== undefined || e.end_year !== undefined) {
              formRef.current.setValue(`${pathBase}.endYear` as any, e.endYear ?? e.end_year);
            }
            if (e.overallPercentage !== undefined) {
              formRef.current.setValue(`${pathBase}.overallPercentage` as any, e.overallPercentage);
            }
            if (e.maximumPossibleGPA !== undefined) {
              formRef.current.setValue(`${pathBase}.maximumPossibleGPA` as any, e.maximumPossibleGPA);
            }
          }

          const degreesArray = [...existingArray];
          const existing = (degreesArray[degreeIdx] || {}) as Record<string, unknown>;

          degreesArray[degreeIdx] = {
            ...existing,
            institutionName: e.institutionName ?? e.schoolName ?? e.institution ?? existing.institutionName,
            city: e.city ?? existing.city,
            degree: e.degree ?? existing.degree,
            major: e.major ?? e.subject ?? existing.major,
            startYear: e.startYear ?? e.start_year ?? existing.startYear,
            endYear: e.endYear ?? e.end_year ?? existing.endYear,
            overallPercentage: e.overallPercentage ?? existing.overallPercentage,
            maximumPossibleGPA: e.maximumPossibleGPA ?? existing.maximumPossibleGPA,
          };

          newDefaults[s] = degreesArray;
        }
      } else if (academicLevel === 'High School (8th–12th grade)') {
        const existingArray = Array.isArray(currentValues.highSchool) ? currentValues.highSchool : [];
        const targetIdx = (parsedTranscriptData as any)._target?.index;
        
        // Calculate index based on target or fallback to first available
        const degreeIdx = typeof targetIdx === 'number' ? targetIdx : 0;
        const pathBase = `highSchool.${degreeIdx}`;

        if (formRef.current) {
          if (e.schoolName !== undefined || e.institution !== undefined || e.institutionName !== undefined) {
            formRef.current.setValue(`${pathBase}.schoolName` as any, e.institutionName ?? e.schoolName ?? e.institution);
          }
          if (e.city !== undefined) formRef.current.setValue(`${pathBase}.city` as any, e.city);
          if (e.board !== undefined) formRef.current.setValue(`${pathBase}.board` as any, e.board);
          if (e.yearOfCompletion !== undefined) formRef.current.setValue(`${pathBase}.yearOfCompletion` as any, e.yearOfCompletion);
          if (e.overallPercentage !== undefined || e.yourTotalScore !== undefined) {
            formRef.current.setValue(`${pathBase}.yourTotalScore` as any, e.yourTotalScore ?? e.overallPercentage);
          }
          if (e.maximumPossibleGPA !== undefined || e.highestTotalScore !== undefined) {
            formRef.current.setValue(`${pathBase}.highestTotalScore` as any, e.highestTotalScore ?? e.maximumPossibleGPA);
          }
        }

        const highSchoolArray = [...existingArray];
        const existing = (highSchoolArray[degreeIdx] || {}) as Record<string, unknown>;
        
        // Map subjects if present
        let updatedSubjects = existing.subjects;
        if (e.subjects && Array.isArray(e.subjects)) {
          updatedSubjects = e.subjects.map((s: any, sIdx: number) => {
            const subj = {
              subject: s.subject || "",
              level: s.level || "",
              yourTotalScore: s.yourTotalScore || "",
              highestTotalScore: s.highestTotalScore || "",
            };
            
            // Also update form values directly for immediate UI feedback
            if (formRef.current) {
              const subPath = `${pathBase}.subjects.${sIdx}`;
              formRef.current.setValue(`${subPath}.subject` as any, subj.subject);
              formRef.current.setValue(`${subPath}.level` as any, subj.level);
              formRef.current.setValue(`${subPath}.yourTotalScore` as any, subj.yourTotalScore);
              formRef.current.setValue(`${subPath}.highestTotalScore` as any, subj.highestTotalScore);
            }
            return subj;
          });
        }

        highSchoolArray[degreeIdx] = {
          ...existing,
          schoolName: e.institutionName ?? e.schoolName ?? e.institution ?? existing.schoolName,
          city: e.city ?? existing.city,
          yearOfCompletion: e.yearOfCompletion ?? existing.yearOfCompletion,
          board: e.board ?? existing.board,
          yourTotalScore: e.yourTotalScore ?? e.overallPercentage ?? existing.yourTotalScore,
          highestTotalScore: e.highestTotalScore ?? e.maximumPossibleGPA ?? existing.highestTotalScore,
          subjects: updatedSubjects ?? existing.subjects,
        };
        newDefaults.highSchool = highSchoolArray;
      }

      if (parsedTranscriptData.testScores) {
        const existingTestScores = Array.isArray(currentValues.testScores) ? currentValues.testScores : [];
        const targetIdx = (parsedTranscriptData as any)._target?.index;

        if (typeof targetIdx === 'number') {
          const scoresArray = [...existingTestScores];
          const aiData = Array.isArray(parsedTranscriptData.testScores)
            ? parsedTranscriptData.testScores[0]
            : parsedTranscriptData.testScores;

          scoresArray[targetIdx] = {
            ...(scoresArray[targetIdx] || {}),
            ...aiData
          };
          newDefaults.testScores = scoresArray;
        }
      }

      // Final fallback to ensure currentFormLevel is synced
      if (newDefaults.academicLevel !== currentFormLevel && formRef.current) {
        formRef.current.setValue('academicLevel', newDefaults.academicLevel as string);
      }

      return newDefaults;
    });
  }, [parsedTranscriptData]);

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
        'Undergraduate': 'undergraduate',
        'Postgraduate': 'postgraduate',
        'Working Professional': 'tenPlus',
      };
      const relevantSection = academicLevel
        ? sectionKey[academicLevel]
        : undefined;

      // Also handle prerequisite section
      const prereqSection = (academicLevel === 'Postgraduate' || academicLevel === 'Working Professional') 
        ? 'undergraduate_prereq' 
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

      // Build the educational object
      if (relevantSection) {
        if (transformedData[relevantSection] !== undefined) {
          cleanEducational[relevantSection] = transformedData[relevantSection];
        }
      }

      if (prereqSection) {
        if (transformedData[prereqSection] !== undefined) {
          cleanEducational[prereqSection] = transformedData[prereqSection];
        }
      }

      if (relevantSection || prereqSection) {

        // Include courses, awards, and test scores at the top level of educational
        const sharedKeys = ['courses', 'awards', 'testScores'];
        sharedKeys.forEach((key) => {
          if (transformedData[key] !== undefined) {
            cleanEducational[key] = transformedData[key];
          }
        });
      }

      // Merge with existing profile data from context
      const existingProfile = profileData || {};

      const updatedProfile = {
        ...existingProfile,
        educational: {
          ...((existingProfile.educational as Record<string, unknown>) || {}),
          ...cleanEducational,
        },
      };

      console.log('Sending updated profile:', updatedProfile);

      const response = await api('/api/profiles/update/', {
        method: 'POST',
        body: { profile: updatedProfile },
      });

      await refetch();
      addToast('Educational details saved successfully!', { type: 'success' });
    } catch (error: any) {
      console.error('Update failed detailed:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack,
        error: error
      });

      // Detailed error for the user to help debugging
      const status = error.cause?.status;
      const detail = error.cause?.body?.error || error.cause?.body?.message || error.message;
      const message = detail
        ? `Save Failed${status ? ` (${status})` : ''}: ${detail}`
        : `Connection or Server Error${status ? ` (${status})` : ''}: ${error.toString() || 'Unknown failure'}`;
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
    'undergraduate_prereq',
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



  return (
    <div className="flex flex-col gap-4">
      <Instructions />
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
          // Toast handled by onSubmit
        }}
        onSaveAndNavigate={() => {
          // Toast handled by onSubmit
          router.push('/profile/professional/edit');
        }}
      />
    </div>
  );
};

export default EducationalDetailsForm;
