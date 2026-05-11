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

  // Sync scanned data into form state
  React.useEffect(() => {
    if (!parsedTranscriptData || Object.keys(parsedTranscriptData).length === 0) return;

    console.log("Syncing scanned data to form:", parsedTranscriptData);
    const currentValues = formRef.current?.getValues() || {};
    const newDefaults: Record<string, any> = { ...currentValues };

    // 1. Map Educational Records
    const educationalRecords = Array.isArray(parsedTranscriptData.educational) 
      ? parsedTranscriptData.educational 
      : [];

    educationalRecords.forEach((e: any) => {
      const level = (e.academicLevel || "").toLowerCase();
      const sections: ("highSchool" | "undergraduate" | "postgraduate" | "tenPlus")[] = [];
      
      if (level.includes('high school') || level.includes('12th') || level.includes('secondary')) sections.push('highSchool');
      if (level.includes('college') || level.includes('undergraduate') || level.includes('bachelor')) {
        sections.push('undergraduate');
        sections.push('undergraduate_prereq'); // Also fill prerequisite if it matches
      }
      if (level.includes('postgraduate') || level.includes('master') || level.includes('phd') || level.includes('mba')) sections.push('postgraduate');
      if (level.includes('working') || level.includes('professional') || level.includes('completed')) sections.push('tenPlus');

      sections.forEach(s => {
        const existingArray = Array.isArray(currentValues[s]) ? currentValues[s] : [];
        let degreeIdx = existingArray.findIndex((d: any) => !d.institutionName);
        if (degreeIdx === -1) degreeIdx = existingArray.length;

        const updatedArray = [...existingArray];
        const existing = updatedArray[degreeIdx] || {};

        updatedArray[degreeIdx] = {
          ...existing,
          gradeLevel: e.gradeLevel ?? e.grade ?? existing.gradeLevel,
          institutionName: e.institutionName ?? e.schoolName ?? e.institution ?? existing.institutionName ?? existing.schoolName,
          schoolName: e.schoolName ?? e.institutionName ?? e.institution ?? existing.schoolName ?? existing.institutionName,
          city: e.city ?? existing.city,
          degree: e.degree ?? existing.degree,
          major: e.major ?? e.subject ?? existing.major,
          startYear: e.startYear ?? e.start_year ?? existing.startYear,
          endYear: e.endYear ?? e.end_year ?? e.yearOfCompletion ?? existing.endYear,
          yearOfCompletion: (() => {
            const raw = e.yearOfCompletion ?? e.endYear ?? e.end_year ?? existing.yearOfCompletion;
            if (!raw) return '';
            // If just YYYY, assume June (06/YYYY)
            if (/^\d{4}$/.test(String(raw))) return `06/${raw}`;
            // If YYYY-MM-DD or YYYY-MM, convert to MM/YYYY
            const dashMatch = String(raw).match(/^(\d{4})-(\d{2})/);
            if (dashMatch) return `${dashMatch[2]}/${dashMatch[1]}`;
            return String(raw);
          })(),
          board: e.board ?? existing.board,
          overallPercentage: e.overallPercentage ?? e.yourTotalScore ?? existing.overallPercentage,
          maximumPossibleGPA: e.maximumPossibleGPA ?? e.highestTotalScore ?? existing.maximumPossibleGPA,
          // Support high school specific field names
          yourTotalScore: e.yourTotalScore ?? e.overallPercentage ?? existing.yourTotalScore,
          highestTotalScore: e.highestTotalScore ?? e.maximumPossibleGPA ?? existing.highestTotalScore,
        };

        if (s === 'highSchool' && e.subjects) {
          updatedArray[degreeIdx].subjects = e.subjects.map((subj: any) => ({
            subject: subj.subject || "",
            level: subj.level || "",
            yourTotalScore: subj.yourTotalScore || "",
            highestTotalScore: subj.highestTotalScore || ""
          }));
        }

        newDefaults[s] = updatedArray;
      });
    });

    // Helper to find data in common variations of keys
    const findKey = (data: any, options: string[]) => {
      for (const opt of options) {
        if (data[opt] && Array.isArray(data[opt])) return data[opt];
        const lowerOpt = opt.toLowerCase();
        const found = Object.keys(data).find(k => k.toLowerCase() === lowerOpt);
        if (found && Array.isArray(data[found])) return data[found];
      }
      return null;
    };

    // 2. Map Courses & Certifications
    const coursesData = findKey(parsedTranscriptData, ['courses', 'certifications', 'coursesAndCertifications', 'certificates']);
    if (coursesData) {
      newDefaults.courses = coursesData.map((c: any) => ({
        courseType: c.courseType || "Certificate",
        description: c.description || c.name || c.title || "N/A",
        year: String(c.year || c.yearOfCompletion || c.date || ""),
        awards: c.awards || c.awardsCertifications || "",
        duration: c.duration || "",
        location: c.location || "Online",
      }));
    }

    // 3. Map Awards & Scholarships
    const awardsData = findKey(parsedTranscriptData, ['awards', 'scholarships', 'honors', 'achievements', 'awardsAndScholarships', 'awardsAndFellowships']);
    if (awardsData) {
      newDefaults.awards = awardsData.map((a: any) => ({
        nameOfHonorReceived: a.nameOfHonorReceived || a.name || a.honor || a.title || "Award/Achievement",
        description: a.description || a.name || a.title || "N/A",
        levelOfCompetitiveness: a.levelOfCompetitiveness || "International",
        numberOfParticipants: String(a.numberOfParticipants || ""),
        year: String(a.year || a.yearOfCompletion || a.date || ""),
      }));
    }

    // 4. Map Test Scores
    if (parsedTranscriptData.testScores && Array.isArray(parsedTranscriptData.testScores)) {
      const existingTestScores = Array.isArray(currentValues.testScores) ? [...currentValues.testScores] : [];
      const targetIdx = (parsedTranscriptData as any)._target?.index;
      
      parsedTranscriptData.testScores.forEach((newScore: any, i: number) => {
        const idx = targetIdx !== undefined ? targetIdx + i : existingTestScores.length;
        
        // Map all potential sub-score fields from AI to form fields
        existingTestScores[idx] = { 
          ...existingTestScores[idx], 
          testType: newScore.testType || existingTestScores[idx]?.testType,
          testDate: newScore.testDate || existingTestScores[idx]?.testDate,
          totalScore: newScore.totalScore || newScore.yourScore || existingTestScores[idx]?.totalScore,
          yourScore: newScore.yourScore || newScore.totalScore || existingTestScores[idx]?.yourScore,
          // Sub-scores
          writingYourScore: newScore.writingYourScore || existingTestScores[idx]?.writingYourScore,
          mathYourScore: newScore.mathYourScore || existingTestScores[idx]?.mathYourScore,
          criticalReadingYourScore: newScore.criticalReadingYourScore || existingTestScores[idx]?.criticalReadingYourScore,
          analyticalWritingScore: newScore.analyticalWritingScore || existingTestScores[idx]?.analyticalWritingScore,
          verbalReasoningScore: newScore.verbalReasoningScore || existingTestScores[idx]?.verbalReasoningScore,
          quantitativeReasoningScore: newScore.quantitativeReasoningScore || existingTestScores[idx]?.quantitativeReasoningScore,
          dataInsightsScore: newScore.dataInsightsScore || existingTestScores[idx]?.dataInsightsScore,
          englishYourScore: newScore.englishYourScore || existingTestScores[idx]?.englishYourScore,
          readingYourScore: newScore.readingYourScore || existingTestScores[idx]?.readingYourScore,
          scienceYourScore: newScore.scienceYourScore || existingTestScores[idx]?.scienceYourScore,
          integratedReasoningScore: newScore.integratedReasoningScore || existingTestScores[idx]?.integratedReasoningScore,
        };
      });
      newDefaults.testScores = existingTestScores;
    }


    // 5. Academic Level & Grade Level Sync
    const firstRec = educationalRecords[0];
    if (firstRec?.academicLevel) {
      const topLevel = firstRec.academicLevel;
      if (topLevel.includes('High School')) newDefaults.academicLevel = 'High School (8th–12th grade)';
      else if (topLevel.includes('Postgraduate')) newDefaults.academicLevel = 'Postgraduate';
      else if (topLevel.includes('Working')) newDefaults.academicLevel = 'Working Professional';
      else newDefaults.academicLevel = 'Undergraduate';

      if (firstRec.gradeLevel) {
        newDefaults.gradeLevel = firstRec.gradeLevel;
        if (newDefaults.academicLevel === 'High School (8th–12th grade)') {
          newDefaults.hasCurrentGradeScores = 'Yes';
        }
      }
    }

    // Apply the update
    setFormDefaults(newDefaults);
    if (formRef.current) {
      formRef.current.reset(newDefaults);
    }
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

      // Include ALL educational sections that have data, not just the relevant one.
      // This ensures that scanned resume data for multiple levels is preserved.
      const allSections = ['highSchool', 'undergraduate', 'postgraduate', 'tenPlus', 'undergraduate_prereq'];
      allSections.forEach((section) => {
        if (transformedData[section] !== undefined && Array.isArray(transformedData[section]) && (transformedData[section] as any[]).length > 0) {
          cleanEducational[section] = transformedData[section];
        }
      });

      // Include shared keys
      const sharedKeys = ['courses', 'awards', 'testScores'];
      sharedKeys.forEach((key) => {
        if (transformedData[key] !== undefined) {
          cleanEducational[key] = transformedData[key];
        }
      });

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
