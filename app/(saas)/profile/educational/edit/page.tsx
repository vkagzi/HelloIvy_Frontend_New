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
import LinkedInImporter from '@/app/_components/LinkedInImporter';
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
  const { profileData, rawApiResponse, refetch, personalDetails, educationalDetails: contextEducationalDetails, parsedTranscriptData, setParsedTranscriptData } = useProfile();
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

  // Extract educational details from the context or defaultValues
  const educationalDetails = React.useMemo(() => {
    let details: Record<string, unknown> = {};

    // Use the context-provided educational details if available
    if (contextEducationalDetails && Object.keys(contextEducationalDetails).length > 0) {
      details = JSON.parse(JSON.stringify(contextEducationalDetails));
    } else {
      const profile = defaultValues?.profile as Record<string, unknown> | undefined;
      const innerProfile = profile?.profile as Record<string, unknown> | undefined;
      if (innerProfile?.educational) {
        // Fallback to manual extraction from defaultValues if context is empty
        details = JSON.parse(JSON.stringify(innerProfile.educational));
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
      const sectionData = details[key];
      if (
        sectionData &&
        typeof sectionData === 'object' &&
        !Array.isArray(sectionData)
      ) {
        const section = sectionData as Record<string, unknown>;
        const arrayKey = key === 'highSchool' ? 'grades' : 'degrees';
        if (section[arrayKey]) {
          details[key] = section[arrayKey];
        }
        for (const sharedKey of ['courses', 'awards', 'testScores']) {
          if (section[sharedKey] !== undefined) {
            details[sharedKey] = section[sharedKey];
          }
        }
      }
    }

    // Normalize startYear / endYear to 4-digit year strings in all degree sections
    const extractYear = (val: unknown): unknown => {
      if (typeof val !== 'string' || !val) return val;
      if (/^\d{4}$/.test(val)) return val;
      const m = val.match(/(\d{4})/);
      return m ? m[1] : val;
    };

    const yearSections = ['undergraduate', 'postgraduate', 'tenPlus', 'undergraduate_prereq'];
    for (const sec of yearSections) {
      const arr = details[sec];
      if (Array.isArray(arr)) {
        details[sec] = arr.map((item: unknown) => {
          if (!item || typeof item !== 'object') return item;
          const rec = item as Record<string, unknown>;
          return {
            ...rec,
            startYear: extractYear(rec.startYear),
            endYear: extractYear(rec.endYear),
          };
        });
      }
    }

    return details;
  }, [contextEducationalDetails, defaultValues]);

  const UG_PG_LEVELS = [
    'College/Undergraduate',
    'Postgraduate',
    'Working/Completed College',
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

    console.log("!!! [EducationalDetailsForm] Syncing scanned data to form:", parsedTranscriptData);

    const target = (parsedTranscriptData as any)._target;
    const isTargeted = target && target.section && target.section !== 'personal';

    // Get current values to preserve fields that are NOT being updated by the scan
    const currentValues = formRef.current?.getValues() || {};
    const currentAcademicLevel = currentValues.academicLevel as string;

    console.log("!!! [EducationalDetailsForm] Syncing scanned data. Current academicLevel in form:", currentAcademicLevel);

    // Start with a merge of DB data and current values
    let newDefaults: Record<string, any> = {
      ...educationalDetails,
      ...currentValues
    };

    if (!isTargeted) {
      console.log("!!! [EducationalDetailsForm] GLOBAL SCAN DETECTED. Performing Hard Reset of defaults.");
      // Start from a clean slate for global sections to prevent "Same Data" pollution
      newDefaults = {
        academicLevel: currentValues.academicLevel,
        gradeLevel: currentValues.gradeLevel,
        courses: [],
        awards: [],
        testScores: [],
        highSchool: [],
        undergraduate: [],
        postgraduate: [],
        tenPlus: [],
        undergraduate_prereq: [],
      };
    }

    // Support various response structures: direct object, direct array, or nested
    // Check common root keys like 'data', 'response', 'scannedData', 'transcript_data'
    const rootData = parsedTranscriptData.data ?? parsedTranscriptData.response ?? parsedTranscriptData.scannedData ?? parsedTranscriptData.transcript_data ?? parsedTranscriptData;
    console.log("[EducationalDetailsForm] Raw parsed data root:", rootData);

    let educationalRecords: any[] = [];
    if (Array.isArray(rootData.educational)) {
      educationalRecords = rootData.educational;
    } else if (rootData.educational?.records && Array.isArray(rootData.educational.records)) {
      educationalRecords = rootData.educational.records;
    } else if (rootData.records && Array.isArray(rootData.records)) {
      educationalRecords = rootData.records;
    } else if (rootData.educational_records && Array.isArray(rootData.educational_records)) {
      educationalRecords = rootData.educational_records;
    } else if (rootData.institutionName || rootData.degree || rootData.schoolName || rootData.universityName || rootData.university || rootData.school) {
      // Single record at root
      educationalRecords = [rootData];
    }

    console.log(`[EducationalDetailsForm] Extracted ${educationalRecords.length} educational records.`);

    const firstRec = educationalRecords[0];

    // Determine Global Target Section from Resume Academic Level
    let globalTargetSection: "highSchool" | "undergraduate" | "postgraduate" | "tenPlus" | null = null;
    const globalLevel = (parsedTranscriptData.academicLevel || "").toLowerCase();

    if (globalLevel.includes('working') || globalLevel.includes('professional') || globalLevel.includes('completed')) {
      globalTargetSection = 'tenPlus';
    } else if (globalLevel.includes('postgraduate') || globalLevel.includes('master') || globalLevel.includes('phd') || globalLevel.includes('mba')) {
      globalTargetSection = 'postgraduate';
    } else if (globalLevel.includes('college') || globalLevel.includes('undergraduate') || globalLevel.includes('bachelor')) {
      globalTargetSection = 'undergraduate';
    } else if (globalLevel.includes('high school') || globalLevel.includes('12th') || globalLevel.includes('secondary')) {
      globalTargetSection = 'highSchool';
    }

    // Helper for case-insensitive and multi-key extraction
    const getValue = (obj: any, keys: string[]) => {
      if (!obj) return undefined;
      for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null) return obj[k];
        const lowerK = k.toLowerCase();
        const foundKey = Object.keys(obj).find(key => key.toLowerCase() === lowerK);
        if (foundKey) return obj[foundKey];
      }
      return undefined;
    };

    // Helper to map a single record to form keys
    const mapRecord = (e: any, section: string) => {
      console.log(`[mapRecord] Mapping record for section ${section}:`, e);

      const cleanScoreValue = (val: any) => {
        if (!val) return "";
        let s = String(val).trim();
        // Remove common suffixes like "/ 10 CGPA", "/ 100", "%"
        s = s.replace(/\/\s*\d+(\.\d+)?\s*(CGPA|GPA|%|marks)?/i, "");
        s = s.replace(/(CGPA|GPA|%|marks)/i, "");
        return s.trim();
      };

      const score = cleanScoreValue(getValue(e, ['yourTotalScore', 'score', 'percentage', 'cgpa', 'overallPercentage', 'totalScore', 'overallGPA', 'gpa', 'aggregateScore', 'marks']) ?? "");
      let maxScore = cleanScoreValue(getValue(e, ['highestTotalScore', 'maximumPossibleGPA', 'maxScore', 'maxGPA', 'maxPossibleScore', 'outOf']) ?? "");

      // Smart default for max score if missing
      if (!maxScore && score) {
        const numScore = parseFloat(String(score));
        if (!isNaN(numScore)) {
          if (numScore <= 10) maxScore = "10";
          else if (numScore <= 100) maxScore = "100";
        }
      }

      // Map repeatable years/semesters for university
      const semestersData = Array.isArray(e.semesters) && e.semesters.length > 0 ? e.semesters : null;
      let aiHasSem = getValue(e, ['hasSemesterWiseScores']);
      let isSemWise = aiHasSem === 'Yes' ? 'Yes' : 'No';

      // Advanced Inference: Force Yes if count > 4 or if explicitly containing semester-like labels
      if (semestersData) {
        const firstTermLabel = String(getValue(semestersData[0], ['semesterName', 'year', 'semester', 'termName', 'yearName']) || "").toLowerCase();
        if (firstTermLabel.includes('semester') || firstTermLabel.includes('sem') || semestersData.length > 4) {
          isSemWise = 'Yes';
        } else if (firstTermLabel.includes('year')) {
          isSemWise = 'No';
        }
      }

      const mapped: any = {
        city: getValue(e, ['city', 'location', 'town', 'address']) ?? "",
        hasSemesterWiseScores: isSemWise,
        // Common fields with different names
        ...(section === 'highSchool' ? {
          schoolName: getValue(e, ['schoolName', 'institutionName', 'universityName', 'university', 'collegeName', 'college', 'school', 'nameOfInstitution', 'institution', 'name']) ?? "",
          gradeLevel: (() => {
            // Try direct gradeLevel / grade / academicLevel fields first
            const raw = String(getValue(e, ['gradeLevel', 'grade', 'class', 'standard', 'academicLevel', 'level']) ?? "");
            const rawUpper = raw.toUpperCase();
            const romanMap: Record<string, number> = { 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12, 'VIII': 8 };
            for (const [rom, num] of Object.entries(romanMap)) {
              if (new RegExp(`\\b${rom}\\b`).test(rawUpper)) return num;
            }
            const match = raw.match(/(\d+)/);
            if (match) {
              const n = parseInt(match[1], 10);
              if (n >= 8 && n <= 12) return n;
            }
            // Fallback: try to find it in degree/program/institutionName
            const degree = (getValue(e, ['degree', 'program', 'institutionName']) || "").toLowerCase();
            const degreeMatch = degree.match(/(10|11|12|8|9)(?:th|st|nd|rd)?\s*(?:grade|class|standard|std)?/);
            if (degreeMatch) return parseInt(degreeMatch[1], 10);
            return undefined;
          })(),
          yearOfCompletion: (() => {
            const raw = getValue(e, ['yearOfCompletion', 'graduationYear', 'endYear', 'end_year', 'endDate', 'end_date', 'year']) ?? "";
            if (!raw) return '';
            if (/^\d{4}$/.test(String(raw))) return `06/${raw}`;
            const dashMatch = String(raw).match(/^(\d{4})-(\d{2})/);
            if (dashMatch) return `${dashMatch[2]}/${dashMatch[1]}`;
            return String(raw);
          })(),
          board: getValue(e, ['board', 'university', 'council', 'affiliation']) ?? "",
          yourTotalScore: score,
          highestTotalScore: maxScore,
        } : {
          institutionName: getValue(e, ['institutionName', 'schoolName', 'universityName', 'university', 'collegeName', 'college', 'school', 'nameOfInstitution']) ?? "",
          degree: getValue(e, ['degree', 'program', 'degreeName', 'qualification']) ?? "",
          major: getValue(e, ['major', 'fieldOfStudy', 'stream', 'specialization', 'department', 'branch']) ?? "",
          startYear: (() => {
            const raw = getValue(e, ['startYear', 'start_year', 'startDate', 'start_date', 'startYear']) ?? "";
            if (raw) return String(raw);
            const dur = getValue(e, ['duration', 'period', 'years']) || "";
            const match = String(dur).split(/[-—]/)[0]?.match(/\d{4}/);
            return match ? match[0] : "";
          })(),
          endYear: (() => {
            const raw = getValue(e, ['endYear', 'end_year', 'yearOfCompletion', 'graduationYear', 'endDate', 'end_date', 'endYear']) ?? "";
            if (raw) return String(raw);
            const dur = getValue(e, ['duration', 'period', 'years']) || "";
            const parts = String(dur).split(/[-—]/);
            const match = (parts[1] || parts[0])?.match(/\d{4}/);
            return match ? match[0] : "";
          })(),
          overallPercentage: score,
          maximumPossibleGPA: maxScore,
        })
      };

      // Map repeatable years/semesters for university
      if (section !== 'highSchool') {
        const legacyData = getValue(e, ['years', 'scoreDetails', 'academicDetails', 'results']) ?? [];
        const yearsData: any[] = semestersData ?? (Array.isArray(legacyData) ? legacyData : []);

        if (yearsData.length > 0) {
          const fieldName = isSemWise === 'Yes' ? 'semesters' : 'years';
          mapped[fieldName] = yearsData.map((y: any, idx: number) => {
            const rawYScore = getValue(y, ['sgpa', 'score', 'cgpa', 'gpa', 'tgpa', 'percentage', 'yourTotalScore', 'marks', 'result', 'gradePoints']) ?? "";
            const yScore = cleanScoreValue(rawYScore);
            const rawMax = getValue(y, ['maxSgpa', 'highestTotalScore', 'maxScore', 'maxGPA', 'maxPossibleScore', 'outOf', 'scale']) ?? "";
            const maxScore = rawMax ? cleanScoreValue(rawMax) : (parseFloat(String(yScore)) <= 10 ? "10" : "100");
            return {
              year: getValue(y, ['semesterName', 'year', 'semester', 'period', 'level', 'termLabel', 'termName']) ?? (idx + 1),
              score: yScore,
              highestTotalScore: maxScore
            };
          });
          console.log(`[mapRecord] Mapped ${mapped[fieldName].length} ${fieldName} for section ${section}`, mapped[fieldName]);
        }
      }

      if (section === 'highSchool') {
        // Map top-level subjects
        if (e.subjects) {
          mapped.subjects = e.subjects.map((subj: any) => ({
            subject: getValue(subj, ['subject', 'name', 'subjectName']) || "",
            level: getValue(subj, ['level', 'grade', 'standard']) || "",
            yourTotalScore: getValue(subj, ['yourTotalScore', 'score', 'marks']) || "",
            highestTotalScore: getValue(subj, ['highestTotalScore', 'maxScore', 'outOf']) || "100"
          }));
        }

        // Map terms (nested subjects)
        const termsData = getValue(e, ['terms', 'semesters']) ?? [];
        if (Array.isArray(termsData) && termsData.length > 0) {
          mapped.terms = termsData.map((t: any, idx: number) => {
            const termSubjs = getValue(t, ['subjects', 'courses']) ?? [];
            return {
              termName: getValue(t, ['termName', 'termLabel', 'semester', 'name']) ?? `Term ${idx + 1}`,
              subjects: Array.isArray(termSubjs) ? termSubjs.map((subj: any) => ({
                subject: getValue(subj, ['subject', 'name', 'subjectName']) || "",
                level: getValue(subj, ['level', 'grade', 'standard']) || "",
                yourTotalScore: getValue(subj, ['yourTotalScore', 'score', 'marks', 'result', 'sgpa', 'cgpa', 'gpa']) || "",
                highestTotalScore: getValue(subj, ['highestTotalScore', 'maxScore', 'outOf', 'scale']) || "100"
              })) : []
            };
          });
          console.log(`[mapRecord] Mapped ${mapped.terms.length} terms for highSchool`);
        }
      }

      console.log(`[mapRecord] Resulting mapped record for ${section}:`, mapped);
      return mapped;
    };

    // 1. Map Educational Records
    if (educationalRecords.length > 0) {
      if (isTargeted) {
        // Targeted Update: Only update the specific row in the target section
        const sectionName = target.section;
        const index = target.index ?? 0;
        console.log(`[EducationalDetailsForm] Targeted scan detected for ${sectionName} index ${index}`);

        const currentArray = Array.isArray(newDefaults[sectionName]) ? [...newDefaults[sectionName]] : [];

        // Smart Record Picking: Find the record that matches the specific grade for this index
        let bestRec = firstRec;
        if (sectionName === 'highSchool' && educationalRecords.length > 1) {
          const gradeLevel = currentValues.gradeLevel as string | undefined;
          const hasScores = currentValues.hasCurrentGradeScores as string | undefined;
          const parsedGrade = gradeLevel ? parseInt(gradeLevel.replace('Grade ', ''), 10) : 9;
          const selectedGrade = !isNaN(parsedGrade) ? parsedGrade : 9;

          if (hasScores && ['Yes', 'No'].includes(hasScores)) {
            const startGrade = hasScores === 'Yes' ? selectedGrade : selectedGrade - 1;
            const targetGradeNum = startGrade - index;

            const matchingRec = educationalRecords.find((e: any) => {
              const raw = String(getValue(e, ['gradeLevel', 'grade', 'academicLevel']) ?? "").toUpperCase();
              const romanMap: Record<string, number> = { 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12, 'VIII': 8 };
              let extracted = parseInt(raw.replace(/GRADE\s+|TH|ST|ND|RD/gi, ''), 10);
              if (isNaN(extracted)) {
                for (const [rom, num] of Object.entries(romanMap)) {
                  if (new RegExp(`\\b${rom}\\b`).test(raw)) { extracted = num; break; }
                }
              }
              return extracted === targetGradeNum;
            });

            if (matchingRec) bestRec = matchingRec;
          }
        }

        if (!currentArray[index]) currentArray[index] = {};
        const mappedData = mapRecord(bestRec, sectionName);
        currentArray[index] = { ...currentArray[index], ...mappedData };

        newDefaults[sectionName] = currentArray;
        console.log(`[EducationalDetailsForm] Updated ${sectionName}[${index}] with mapped data.`, newDefaults[sectionName]);
      } else {
        // Global Update: Intelligence mapping for the entire section
        // Note: newDefaults was already initialized with empty arrays at the top of this effect
        const sectionsToClear = new Set<string>();

        const detectedAcademicLevel = (parsedTranscriptData.academicLevel || "").toLowerCase();

        // SMART DETECTION: Check if there are any full-time professional experiences in the data
        const professionalExperiences = rootData.professional?.experiences || rootData.professional || [];
        const hasFullTimeExp = Array.isArray(professionalExperiences) && professionalExperiences.some((exp: any) => {
          const type = (exp.experienceType || exp.experience_type || "").toLowerCase();
          return type.includes('full-time') || type.includes('working') || type.includes('job');
        });

        // SMART PG DETECTION: Check for PG degrees in the educational records
        const hasPGDegree = educationalRecords.some((e: any) => {
          const degree = (getValue(e, ['degree', 'program']) || "").toLowerCase();
          return degree.includes('master') || degree.includes('m.tech') || degree.includes('mba') ||
            degree.includes('msc') || degree.includes('m.a') || degree.includes('pg');
        });

        const isWorkingProf = currentAcademicLevel === 'Working/Completed College' ||
          detectedAcademicLevel.includes('working') ||
          hasFullTimeExp;

        const isPostgrad = currentAcademicLevel === 'Postgraduate' ||
          detectedAcademicLevel.includes('postgraduate') ||
          hasPGDegree;

        const isHighSchool = currentAcademicLevel === 'High School (8th–12th grade)' || detectedAcademicLevel.includes('high school');

        console.log(`[EducationalDetailsForm] Sync Logic - isWorkingProf: ${isWorkingProf}, isPostgrad: ${isPostgrad} (hasPG: ${hasPGDegree}), current: ${currentAcademicLevel}, detected: ${detectedAcademicLevel}`);

        educationalRecords.forEach((e: any) => {
          const searchLevel = (getValue(e, ['academicLevel', 'level', 'degree', 'program', 'institutionName']) || "").toLowerCase();
          const degreeName = (getValue(e, ['degree', 'program']) || "").toLowerCase();
          const sections: string[] = [];

          // 1. Strict High School check
          const isHS = searchLevel.includes('high school') || searchLevel.includes('12th') ||
            searchLevel.includes('secondary') || searchLevel.includes('school') ||
            degreeName.includes('grade') || degreeName.includes('standard');

          if (isHS) {
            sections.push('highSchool');
          } else {
            // 2. Routing for Degrees (UG/PG)
            if (isWorkingProf) {
              // FOR WORKING PROFESSIONALS: EVERYTHING non-HS goes ONLY to tenPlus
              // This is what the user wants: "working prof should apper only in working prof section"
              sections.push('tenPlus');
            } else if (isPostgrad) {
              // FOR POSTGRADUATES: Route based on degree type
              const isPG = degreeName.includes('master') || degreeName.includes('mba') || degreeName.includes('msc') ||
                degreeName.includes('m.a') || degreeName.includes('m.tech') || degreeName.includes('pg') ||
                searchLevel.includes('postgraduate');

              if (isPG) {
                sections.push('postgraduate');
              } else {
                // If it's a Bachelors degree but user is marked as Postgrad,
                // push to undergraduate_prereq ONLY (to avoid duplicate entries).
                sections.push('undergraduate_prereq');
              }
            } else {
              // FOR UNDERGRADUATES: Default to undergraduate
              sections.push('undergraduate');
            }
          }

          // Fallback if no sections were identified but we have a global target
          if (sections.length === 0 && globalTargetSection) {
            // Respect Working Professional priority even in fallback
            if (isWorkingProf) sections.push('tenPlus');
            else {
              sections.push(globalTargetSection);
              if (globalTargetSection === 'undergraduate') sections.push('undergraduate_prereq');
            }
          }

          sections.forEach(s => {
            // Ensure we don't clear a section we already added data to in this same scan
            if (!sectionsToClear.has(s)) {
              newDefaults[s] = [];
              sectionsToClear.add(s);
            }

            const updatedArray = Array.isArray(newDefaults[s]) ? [...newDefaults[s]] : [];
            updatedArray.push(mapRecord(e, s));
            newDefaults[s] = updatedArray;
          });
        });

        console.log(`[EducationalDetailsForm] Global update complete. Cleared and updated:`, Array.from(sectionsToClear));
      }
    }

    // Helper to find data in common variations of keys
    const findKey = (data: any, options: string[]) => {
      for (const opt of options) {
        if (data[opt] && Array.isArray(data[opt])) return data[opt];
        const found = Object.keys(data).find(k => k.toLowerCase() === opt.toLowerCase());
        if (found && Array.isArray(data[found])) return data[found];
      }
      return null;
    };

    // 2. Map Courses & Certifications
    const coursesKeys = ['courses', 'certifications', 'coursesAndCertifications', 'certificates', 'certificationsAndAwards', 'achievementsAndCertifications', 'achievements'];
    let coursesData = findKey(rootData, coursesKeys);
    
    // Check nested educational object if not in root
    if (!coursesData && rootData.educational) {
      coursesData = findKey(rootData.educational, coursesKeys);
    }

    if (coursesData && Array.isArray(coursesData) && coursesData.length > 0) {
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
    const awardsKeys = ['awards', 'scholarships', 'honors', 'achievements', 'awardsAndScholarships', 'awardsAndFellowships', 'certificationsAndAwards', 'achievementsAndCertifications'];
    let awardsData = findKey(rootData, awardsKeys);

    // Check nested educational object if not in root
    if (!awardsData && rootData.educational) {
      awardsData = findKey(rootData.educational, awardsKeys);
    }

    if (awardsData && Array.isArray(awardsData) && awardsData.length > 0) {
      newDefaults.awards = awardsData.map((a: any) => ({
        nameOfHonorReceived: a.nameOfHonorReceived || a.name || a.honor || a.title || "Award/Achievement",
        description: a.description || a.name || a.title || "N/A",
        levelOfCompetitiveness: a.levelOfCompetitiveness || "International",
        numberOfParticipants: String(a.numberOfParticipants || ""),
        year: String(a.year || a.yearOfCompletion || a.date || ""),
      }));
    }

    // 4. Map Test Scores
    const testScoresData = parsedTranscriptData.testScores || parsedTranscriptData.test_scores || findKey(parsedTranscriptData, ['testScores', 'test_scores']);

    if (testScoresData && Array.isArray(testScoresData) && testScoresData.length > 0) {
      newDefaults.testScores = testScoresData.map((newScore: any) => {
        const cleanScore = { ...newScore };

        // Dynamic Alias Resolution
        const findVal = (keys: string[]) => {
          for (const k of keys) {
            const foundKey = Object.keys(cleanScore).find(
              (x) => x.toLowerCase() === k.toLowerCase() || x.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
            );
            if (foundKey && cleanScore[foundKey] !== undefined && cleanScore[foundKey] !== null && cleanScore[foundKey] !== '') {
              return cleanScore[foundKey];
            }
          }
          return undefined;
        };

        const sanitizePercentile = (val: any) => {
          if (val === undefined || val === null || val === '') return undefined;
          const digits = String(val).replace(/[^\d]/g, '');
          return digits ? Number(digits) : undefined;
        };

        // Explicitly map percentiles using alias groups to match fieldDefinitions.ts IDs
        const verbalPercentileVal = findVal(['verbalReasoningPercentile', 'verbalPercentile', 'verbal_percentile', 'verbalReasoningPercent']);
        const quantPercentileVal = findVal(['quantitativeReasoningPercentile', 'quantPercentile', 'quantitativePercentile', 'quant_percentile', 'quantitativeReasoningPercent']);
        const diPercentileVal = findVal(['dataInsightsPercentile', 'dataInsightPercentile', 'data_insights_percentile', 'dataInsightsPercent']);
        const awaPercentileVal = findVal(['analyticalWritingPercentile', 'awaPercentile', 'awa_percentile', 'analyticalWritingPercent']);
        const totalPercentileVal = findVal(['yourPercentile', 'totalPercentile', 'percentile', 'total_percentile', 'scorePercentile', 'yourScorePercentile']);
        const mathPercentileVal = findVal(['mathYourPercentile', 'mathPercentile', 'math_percentile']);
        const readingPercentileVal = findVal(['criticalReadingYourPercentile', 'readingPercentile', 'reading_percentile', 'criticalReadingPercentile']);
        const irPercentileVal = findVal(['integratedReasoningPercentile', 'irPercentile', 'ir_percentile']);

        // Normalize testType to exact dropdown option strings to trigger GMAT/GRE layout rendering
        const rawTestType = String(cleanScore.testType || "").trim();
        let testType = "Other";
        let testTypeOther = "";

        if (rawTestType.toLowerCase().includes('gmat')) {
          testType = "GMAT";
        } else if (rawTestType.toLowerCase().includes('gre')) {
          testType = "GRE";
        } else if (rawTestType.toLowerCase().includes('sat')) {
          testType = "SAT";
        } else if (rawTestType.toLowerCase().includes('act')) {
          testType = "ACT";
        } else if (rawTestType.toLowerCase().includes('toefl')) {
          testType = "TOEFL";
        } else if (rawTestType.toLowerCase().includes('ielts')) {
          testType = "IELTS";
        } else if (rawTestType.toLowerCase().includes('executive')) {
          testType = "Executive Assessment";
        } else if (rawTestType) {
          testType = "Other";
          testTypeOther = rawTestType;
        }

        return {
          ...cleanScore,
          testType,
          testTypeOther,
          testDate: cleanScore.testDate || "",
          totalScore: cleanScore.totalScore || cleanScore.yourScore || "",
          yourScore: cleanScore.yourScore || cleanScore.totalScore || "",
          writingYourScore: cleanScore.writingYourScore || "",
          mathYourScore: cleanScore.mathYourScore || "",
          criticalReadingYourScore: cleanScore.criticalReadingYourScore || "",
          analyticalWritingScore: cleanScore.analyticalWritingScore || "",
          verbalReasoningScore: cleanScore.verbalReasoningScore || "",
          quantitativeReasoningScore: cleanScore.quantitativeReasoningScore || "",
          dataInsightsScore: cleanScore.dataInsightsScore || "",
          englishYourScore: cleanScore.englishYourScore || "",
          readingYourScore: cleanScore.readingYourScore || "",
          scienceYourScore: cleanScore.scienceYourScore || "",
          integratedReasoningScore: cleanScore.integratedReasoningScore || "",

          // Map sanitized percentiles to precise React Hook Form fields
          verbalReasoningPercentile: sanitizePercentile(verbalPercentileVal),
          quantitativeReasoningPercentile: sanitizePercentile(quantPercentileVal),
          dataInsightsPercentile: sanitizePercentile(diPercentileVal),
          analyticalWritingPercentile: sanitizePercentile(awaPercentileVal),
          yourPercentile: sanitizePercentile(totalPercentileVal),
          mathYourPercentile: sanitizePercentile(mathPercentileVal),
          criticalReadingYourPercentile: sanitizePercentile(readingPercentileVal),
          integratedReasoningPercentile: sanitizePercentile(irPercentileVal),
        };
      });
      console.log('!!! [EducationalDetailsForm] Mapped testScores:', JSON.stringify(newDefaults.testScores, null, 2));
    }

    // 5. Academic Level Sync
    if (parsedTranscriptData.academicLevel && !isTargeted) {
      const topLevel = parsedTranscriptData.academicLevel;

      // PROTECTION: If the user has manually selected Working Professional or Postgraduate, 
      // do not let the AI downgrade them to Undergraduate unless they were originally in HS.
      // Also respect the smart detection from above.
      const professionalExperiences = rootData.professional?.experiences || rootData.professional || [];
      const hasFullTimeExp = Array.isArray(professionalExperiences) && professionalExperiences.some((exp: any) => {
        const type = (exp.experienceType || exp.experience_type || "").toLowerCase();
        return type.includes('full-time') || type.includes('working') || type.includes('job');
      });

      // SMART PG DETECTION
      const hasPGDegree = educationalRecords.some((e: any) => {
        const degree = (getValue(e, ['degree', 'program']) || "").toLowerCase();
        return degree.includes('master') || degree.includes('m.tech') || degree.includes('mba') ||
          degree.includes('msc') || degree.includes('m.a') || degree.includes('pg');
      });

      const isCurrentlyProfessional = currentAcademicLevel === 'Working/Completed College' ||
        currentAcademicLevel === 'Postgraduate' ||
        hasFullTimeExp ||
        hasPGDegree;

      const isAiSayingUndergrad = topLevel.toLowerCase().includes('undergraduate') || topLevel.toLowerCase().includes('college');

      if (topLevel.includes('High School')) {
        // Only set to high school if we are currently in HS or nothing
        if (!isCurrentlyProfessional && currentAcademicLevel !== 'College/Undergraduate') {
          newDefaults.academicLevel = 'High School (8th–12th grade)';
        }
      } else if (topLevel.includes('Postgraduate') || hasPGDegree) {
        // Only set to postgrad if we aren't already a Working Professional
        if (currentAcademicLevel !== 'Working/Completed College' && !hasFullTimeExp) {
          newDefaults.academicLevel = 'Postgraduate';
        }
      } else if (topLevel.includes('Working') || hasFullTimeExp) {
        newDefaults.academicLevel = 'Working/Completed College';
      } else if (!isCurrentlyProfessional || !isAiSayingUndergrad) {
        // Only set to undergraduate if we aren't already in a "higher" level or if the AI is specifically saying undergrad
        newDefaults.academicLevel = 'College/Undergraduate';
      }
    }

    // Support grade level specifically
    if (firstRec?.gradeLevel && !isTargeted) {
      newDefaults.gradeLevel = firstRec.gradeLevel;
      if (newDefaults.academicLevel && newDefaults.academicLevel.includes('High School')) {
        newDefaults.hasCurrentGradeScores = 'Yes';
      }
    }

    setFormDefaults(newDefaults);
    if (formRef.current) {
      formRef.current.reset(newDefaults);
    }
  }, [parsedTranscriptData, educationalDetails]); // eslint-disable-line react-hooks/exhaustive-deps

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

      // WE DO NOT TRANSFORM AGAIN ON SUBMIT!
      // The form data is already in the correct format.
      // transformEducationalData was converting our form data (which uses 'yearOfCompletion')
      // into backend format (which expects 'year'), breaking the form when re-rendering.
      // We just use parsedData directly!

      // Build a clean educational object with only relevant keys.
      // Only the academic section matching the current academicLevel is included;
      // stale sections from a previous academicLevel selection are dropped.
      const academicLevel = parsedData.academicLevel as string | undefined;
      const sectionKey: Record<string, string> = {
        'High School (8th–12th grade)': 'highSchool',
        'College/Undergraduate': 'undergraduate',
        'Postgraduate': 'postgraduate',
        'Working/Completed College': 'tenPlus',
      };
      const relevantSection = academicLevel
        ? sectionKey[academicLevel]
        : undefined;

      // Also handle prerequisite section
      const prereqSection = (academicLevel === 'Postgraduate' || academicLevel === 'Working/Completed College')
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
        if (parsedData.gradeLevel !== undefined) {
          cleanEducational.gradeLevel = parsedData.gradeLevel;
        }
      }

      // High-school-only fields
      if (academicLevel === 'High School (8th–12th grade)') {
        if (parsedData.hasCurrentGradeScores !== undefined) {
          cleanEducational.hasCurrentGradeScores =
            parsedData.hasCurrentGradeScores;
        }
      }

      // Include ALL educational sections that have data, not just the relevant one.
      // This ensures that scanned resume data for multiple levels is preserved.
      const allSections = ['highSchool', 'undergraduate', 'postgraduate', 'tenPlus', 'undergraduate_prereq'];

      // PROTECTION AGAINST DATA POLLUTION:
      // If we are in Working Professional mode, we should explicitly clear UG/PG sections 
      // if they aren't provided in the current form data (which they shouldn't be).
      if (academicLevel === 'Working/Completed College') {
        cleanEducational.undergraduate = [];
        cleanEducational.postgraduate = [];
        cleanEducational.undergraduate_prereq = [];
      } else if (academicLevel === 'Postgraduate') {
        cleanEducational.tenPlus = [];
      }

      allSections.forEach((section) => {
        if (parsedData[section] !== undefined && Array.isArray(parsedData[section])) {
          // Only include if it's not empty, OR if we explicitly cleared it above
          if ((parsedData[section] as any[]).length > 0 || cleanEducational[section] !== undefined) {
            cleanEducational[section] = parsedData[section];
          }
        }
      });

      // Include shared keys
      const sharedKeys = ['courses', 'awards', 'testScores'];
      sharedKeys.forEach((key) => {
        if (parsedData[key] !== undefined) {
          cleanEducational[key] = parsedData[key];
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

      // Clear scan data so the form re-renders from fresh server data
      setParsedTranscriptData((prev: any) => {
        if (!prev) return prev;
        const next = { ...prev };
        delete next.educational;
        delete next.courses;
        delete next.awards;
        delete next.testScores;
        return next;
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


  // Populate form defaults from existing educational data
  // Only load saved server data when there is NO active resume scan.
  // If a scan is present, the scan sync useEffect above already handled it.
  useEffect(() => {
    const hasEduScan = parsedTranscriptData && (parsedTranscriptData.educational || parsedTranscriptData.courses || parsedTranscriptData.awards || parsedTranscriptData.testScores);
    if (hasEduScan) {
      // A scan is active — do not overwrite it with old server data.
      return;
    }
    if (educationalDetails && Object.keys(educationalDetails).length > 0) {
      console.log("[EducationalDetailsForm] No active scan. Loading saved server data.");
      setFormDefaults(educationalDetails);
    }
  }, [educationalDetails, parsedTranscriptData]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <ResumeUploader />
        <LinkedInImporter />
      </div>
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
          // Toast and reload handled by onSubmit
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
