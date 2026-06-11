'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { Controller, UseFormReturn, useWatch } from 'react-hook-form';
import Button from '@/app/_components/Button';
import { FieldRenderer } from '@/app/_components/dynamic-form/FieldRenderer';
import { LayoutItem } from '@/app/_components/dynamic-form/types/type';
import { FieldDefinition } from '@/app/utils/dynamicForm';
import { Label } from '@/app/_components/Typography';
import { isFieldVisible } from '@/app/_components/dynamic-form/utils/utils';
import TranscriptUploader from '@/app/_components/TranscriptUploader';
import {
  americanSubjects,
  cambridgeALevelSubjects,
  cambridgeIGCSESubjects,
  cbseSubjects,
  hscSubjects,
  icseSubjects,
  ibSubjects,
  iscSubjects,
  niosSubjects,
  stateBoardSubjects,
  seniorSecondarySubjects,
  mypSubjects,
  ibcpSubjects,
} from '@/app/(saas)/profile/_config/fieldDefinitions';

/** Returns the list of grades to display in descending order (always 2 grades) */
const computeGradesToShow = (
  selectedGrade: number,
  hasCurrentGradeScores: string | undefined,
  academicLevel?: string,
  gradeLevel?: string
): number[] => {
  if (
    (academicLevel === 'College/Undergraduate' || academicLevel === 'Working/Completed College') &&
    (gradeLevel === 'Year 1' || gradeLevel === 'Year 2')
  ) {
    if (gradeLevel === 'Year 1' && hasCurrentGradeScores === 'No') {
      return [12, 11];
    }
    if (
      (gradeLevel === 'Year 1' && hasCurrentGradeScores === 'Yes') ||
      (gradeLevel === 'Year 2' && hasCurrentGradeScores === 'No')
    ) {
      return [12];
    }
  }

  if (
    !hasCurrentGradeScores ||
    !['Yes', 'No'].includes(hasCurrentGradeScores)
  ) {
    return [];
  }
  // If the student has current grade scores: show current grade and previous grade
  // e.g. Grade 10 + Yes => [10, 9]
  // If not: show previous two grades
  // e.g. Grade 10 + No  => [9, 8]
  const startGrade =
    hasCurrentGradeScores === 'Yes' ? selectedGrade : selectedGrade - 1;
  return [startGrade, startGrade - 1];
};

interface SchoolBlockProps {
  section: LayoutItem;
  sectionType: string;
  fieldDefs: FieldDefinition[];
  form: UseFormReturn<Record<string, unknown>>;
  errors: Record<string, string>;
  selectedGrade?: number;
  hasCurrentGradeScores?: string;
}

type SubjectRows = Record<string, unknown>[];

export const SchoolBlock: React.FC<SchoolBlockProps> = ({
  section,
  sectionType,
  fieldDefs,
  form,
  errors,
  selectedGrade = 9,
  hasCurrentGradeScores,
}) => {
  const minSubjects = section.repeatables?.repeatable_option?.min ?? 1;

  // Watch top-level fields for college fallback
  const academicLevel = useWatch({ control: form.control, name: 'academicLevel' }) as string | undefined;
  const gradeLevel = useWatch({ control: form.control, name: 'gradeLevel' }) as string | undefined;
  const hasCurrentGradeScoresForm = useWatch({ control: form.control, name: 'hasCurrentGradeScores' }) as string | undefined;

  // Helper to calculate grid template columns with field widths
  const getGridTemplateColumns = (fieldIds: string[]): string => {
    const widths = fieldIds.map((fid) => {
      const field = fieldDefs.find((f) => f.id === fid);
      return field?.width ?? 1;
    });
    return widths.map((w) => `${w}fr`).join(' ');
  };

  // Reactively compute the list of grades to display (descending order)
  const gradesToShow = useMemo(
    () => computeGradesToShow(selectedGrade, hasCurrentGradeScoresForm, academicLevel, gradeLevel),
    [selectedGrade, hasCurrentGradeScoresForm, academicLevel, gradeLevel]
  );

  // Ref to persist form data snapshots keyed by grade number across renders.
  // When gradesToShow changes, Controllers un-/re-register at new array indices,
  // which corrupts the form store BEFORE useEffect can read it.
  // This ref captures form data during the render phase (before commit),
  // so that useEffect can restore the correct values.
  const gradeDataRef = useRef<Record<number, Record<string, unknown>>>({});

  // Snapshot form data DURING render, BEFORE React commits and
  // Controllers re-register (which would corrupt the form store).
  // Only capture entries for grades currently in gradesToShow to prevent
  // stale data from being restored when grades reappear.
  const currentFormArray = form.getValues(sectionType) as
    | Record<string, unknown>[]
    | undefined;
  if (Array.isArray(currentFormArray)) {
    currentFormArray.forEach((entry) => {
      if (entry && typeof entry === 'object') {
        const rawGrade = String((entry as Record<string, unknown>).gradeLevel || (entry as Record<string, unknown>).grade || '').toUpperCase();
        let g = parseInt(rawGrade.replace(/GRADE\s+|TH|ST|ND|RD/gi, ''), 10);
        
        // Support Roman numerals if parsing as integer failed
        if (isNaN(g)) {
          const romanMap: Record<string, number> = { 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12, 'VIII': 8 };
          for (const [rom, num] of Object.entries(romanMap)) {
            if (new RegExp(`\\b${rom}\\b`).test(rawGrade)) {
              g = num;
              break;
            }
          }
        }

        // Snapshot ALL grades so AI extracted data for non-visible grades isn't lost
        if (!isNaN(g)) {
          gradeDataRef.current[g] = { ...(entry as Record<string, unknown>) };
        }
      }
    });
  }

  // Subject rows are tracked per grade number to survive grade list changes
  const [subjectRowsByGrade, setSubjectRowsByGrade] = useState<
    Record<number, SubjectRows>
  >(() => {
    const formAcademic = form.getValues('academicLevel') as string | undefined;
    const formGrade = form.getValues('gradeLevel') as string | undefined;
    const formScores = form.getValues('hasCurrentGradeScores') as string | undefined;
    const initialGrades = computeGradesToShow(
      selectedGrade,
      formScores,
      formAcademic,
      formGrade
    );
    const existingSchools = form.getValues(sectionType) as unknown[];
    const map: Record<number, SubjectRows> = {};

    initialGrades.forEach((grade, idx) => {
      const existingSubjects =
        Array.isArray(existingSchools) && existingSchools[idx]
          ? (existingSchools[idx] as Record<string, unknown>)[
          section.repeatables?.name ?? 'subjects'
          ]
          : null;
      const subjectsCount = Array.isArray(existingSubjects)
        ? existingSubjects.length
        : minSubjects;
      map[grade] = Array.from({ length: subjectsCount }, () => ({
        _id: nanoid(),
        ...Object.fromEntries(
          (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
        ),
      }));
    });
    return map;
  });

  const [termSubjectRowsByGrade, setTermSubjectRowsByGrade] = useState<
    Record<number, Record<number, SubjectRows>>
  >(() => {
    const formAcademic = form.getValues('academicLevel') as string | undefined;
    const formGrade = form.getValues('gradeLevel') as string | undefined;
    const formScores = form.getValues('hasCurrentGradeScores') as string | undefined;
    const initialGrades = computeGradesToShow(
      selectedGrade,
      formScores,
      formAcademic,
      formGrade
    );
    const existingSchools = form.getValues(sectionType) as unknown[];
    const map: Record<number, Record<number, SubjectRows>> = {};

    initialGrades.forEach((grade, idx) => {
      const schoolData =
        Array.isArray(existingSchools) && existingSchools[idx]
          ? (existingSchools[idx] as Record<string, unknown>)
          : null;
      
      if (schoolData && schoolData.hasTermWiseScores === 'Yes') {
        const termsList = schoolData.terms as any[];
        if (Array.isArray(termsList)) {
          const gradeTerms: Record<number, SubjectRows> = {};
          termsList.forEach((term, termIdx) => {
            const termSubjects = term?.subjects;
            const subjectsCount = Array.isArray(termSubjects)
              ? termSubjects.length
              : minSubjects;
            gradeTerms[termIdx] = Array.from({ length: subjectsCount }, (_, sIdx) => ({
              _id: nanoid(),
              ...Object.fromEntries(
                (section.repeatables?.fields ?? []).map((fid: string) => [
                  fid,
                  (Array.isArray(termSubjects) && termSubjects[sIdx]?.[fid]) ?? '',
                ])
              ),
            }));
          });
          map[grade] = gradeTerms;
        }
      }
    });
    return map;
  });

  useEffect(() => {
    // Sync subject rows map and form grade values whenever gradesToShow changes

    setSubjectRowsByGrade((prev) => {
      const next: Record<number, SubjectRows> = {};
      // Only keep subject rows for grades that are currently allowed
      gradesToShow.forEach((grade) => {
        // Reuse existing rows if grade still in the set AND has saved data
        if (prev[grade] && gradeDataRef.current[grade]) {
          next[grade] = prev[grade];
        } else {
          // Create fresh rows for new/unknown grades
          next[grade] = Array.from({ length: minSubjects }, () => ({
            _id: nanoid(),
            ...Object.fromEntries(
              (section.repeatables?.fields ?? []).map((fid: string) => [
                fid,
                '',
              ])
            ),
          }));
        }
      });
      // All entries for grades NOT in gradesToShow are dropped (not copied to next)
      return next;
    });

    // Build an empty template for a grade entry so that every field is
    // explicitly set to '' for new grades. This prevents Controllers from
    // picking up stale values left at the same array index by a previous grade.
    const allSectionFieldIds = section.fields ?? [];
    const subjectsFieldName = section.repeatables?.name ?? 'subjects';
    const repeatableFieldIds = section.repeatables?.fields ?? [];

    // Build empty subjects array with minSubjects rows
    const emptySubjects = Array.from({ length: minSubjects }, () =>
      Object.fromEntries(repeatableFieldIds.map((fid: string) => [fid, '']))
    );

    const emptyEntry: Record<string, unknown> = {
      gradeLevel: 0,
      ...Object.fromEntries(allSectionFieldIds.map((fid: string) => [fid, ''])),
      [subjectsFieldName]: emptySubjects,
    };

    // Use the pre-render snapshot (gradeDataRef) to remap form data.
    // Reading form.getValues() HERE would return corrupted data because
    // Controller un-/re-registration during React's commit phase
    // rewrites the form store before this effect runs.
    const remapped = gradesToShow.map((grade) =>
      gradeDataRef.current[grade]
        ? { ...gradeDataRef.current[grade], gradeLevel: grade }
        : { ...emptyEntry, gradeLevel: grade }
    );

    form.setValue(
      sectionType as keyof Record<string, unknown>,
      remapped as never,
      { shouldDirty: true }
    );

    // Explicitly set every field at every index so that individually
    // registered Controllers are overwritten with the correct value.
    gradesToShow.forEach((grade, idx) => {
      const entry = remapped[idx];
      Object.entries(entry).forEach(([key, value]) => {
        if (key === subjectsFieldName) return; // subjects handled below
        form.setValue(
          `${sectionType}.${idx}.${key}` as keyof Record<string, unknown>,
          (value ?? '') as never
        );
      });

      // Explicitly set subject fields so Controllers pick up correct values
      const entryRecord = entry as Record<string, unknown>;
      const subjects = (entryRecord[subjectsFieldName] ?? []) as Record<
        string,
        unknown
      >[];
      subjects.forEach((subject, subIdx) => {
        repeatableFieldIds.forEach((fid: string) => {
          form.setValue(
            `${sectionType}.${idx}.${subjectsFieldName}.${subIdx}.${fid}` as keyof Record<
              string,
              unknown
            >,
            (subject[fid] ?? '') as never
          );
        });
      });
    });
  }, [gradesToShow.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Watch for changes in the form data (e.g. from AI uploader) to sync subject rows
  const watchedSectionData = useWatch({
    control: form.control,
    name: sectionType as any,
  });

  useEffect(() => {
    if (!Array.isArray(watchedSectionData)) return;

    setSubjectRowsByGrade((prev) => {
      let changed = false;
      const next = { ...prev };

      watchedSectionData.forEach((entry, idx) => {
        const grade = gradesToShow[idx];
        if (grade === undefined) return;

        // Ensure the record actually belongs to this grade before syncing subjects
        const rawEntryGrade = String((entry as Record<string, unknown>).gradeLevel || (entry as Record<string, unknown>).grade || '').toUpperCase();
        let entryGrade = parseInt(rawEntryGrade.replace(/GRADE\s+|TH|ST|ND|RD/gi, ''), 10);
        if (isNaN(entryGrade)) {
          const romanMap: Record<string, number> = { 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12, 'VIII': 8 };
          for (const [rom, num] of Object.entries(romanMap)) {
            if (new RegExp(`\\b${rom}\\b`).test(rawEntryGrade)) {
              entryGrade = num;
              break;
            }
          }
        }
        
        // If the entry has a different grade than the section we are syncing, skip it.
        // The remapping useEffect will soon fix the array order.
        if (!isNaN(entryGrade) && entryGrade !== grade) return;

        const subjectsFieldName = section.repeatables?.name ?? 'subjects';
        const formSubjects = (entry as Record<string, unknown>)?.[subjectsFieldName] as any[];

        if (Array.isArray(formSubjects)) {
          const currentRows = prev[grade] || [];
          if (formSubjects.length !== currentRows.length) {
            changed = true;
            next[grade] = formSubjects.map((s, sIdx) => ({
              _id: currentRows[sIdx]?._id || nanoid(),
              ...s
            }));
          }
        }
      });

      return changed ? next : prev;
    });
  }, [watchedSectionData, gradesToShow, section.repeatables?.name]);

  // Sync term subject rows map when watchedSectionData changes
  useEffect(() => {
    if (!Array.isArray(watchedSectionData)) return;

    setTermSubjectRowsByGrade((prev) => {
      let changed = false;
      const next = { ...prev };

      watchedSectionData.forEach((entry, idx) => {
        const grade = gradesToShow[idx];
        if (grade === undefined) return;

        // Ensure the record actually belongs to this grade
        const rawEntryGrade = String((entry as Record<string, unknown>).gradeLevel || (entry as Record<string, unknown>).grade || '').toUpperCase();
        let entryGrade = parseInt(rawEntryGrade.replace(/GRADE\s+|TH|ST|ND|RD/gi, ''), 10);
        if (isNaN(entryGrade)) {
          const romanMap: Record<string, number> = { 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12, 'VIII': 8 };
          for (const [rom, num] of Object.entries(romanMap)) {
            if (new RegExp(`\\b${rom}\\b`).test(rawEntryGrade)) {
              entryGrade = num;
              break;
            }
          }
        }
        
        if (!isNaN(entryGrade) && entryGrade !== grade) return;

        const hasTermWise = (entry as Record<string, unknown>)?.hasTermWiseScores === 'Yes';
        if (!hasTermWise) return;

        const termsList = (entry as Record<string, unknown>)?.terms as any[];
        if (Array.isArray(termsList)) {
          const currentGradeTerms = prev[grade] || {};
          let gradeChanged = false;
          const nextGradeTerms: Record<number, SubjectRows> = { ...currentGradeTerms };

          termsList.forEach((term, termIdx) => {
            const formSubjects = term?.subjects as any[];
            if (Array.isArray(formSubjects)) {
              const currentRows = currentGradeTerms[termIdx] || [];
              const subjectsChanged = formSubjects.some((s, sIdx) => {
                const currentRow = currentRows[sIdx];
                if (!currentRow) return true;
                return Object.entries(s).some(([key, val]) => currentRow[key] !== val);
              });

              if (formSubjects.length !== currentRows.length || subjectsChanged) {
                gradeChanged = true;
                nextGradeTerms[termIdx] = formSubjects.map((s, sIdx) => ({
                  _id: currentRows[sIdx]?._id || nanoid(),
                  ...s
                }));
              }
            }
          });

          if (gradeChanged || Object.keys(nextGradeTerms).length !== Object.keys(currentGradeTerms).length) {
            changed = true;
            next[grade] = nextGradeTerms;
          }
        }
      });

      return changed ? next : prev;
    });
  }, [watchedSectionData, gradesToShow, section.repeatables?.name]);

  // Watch for changes in hasTermWiseScores to initialize terms list with Term 1
  useEffect(() => {
    if (!Array.isArray(watchedSectionData)) return;

    watchedSectionData.forEach((entry, idx) => {
      const grade = gradesToShow[idx];
      if (grade === undefined) return;

      const hasTermWise = (entry as Record<string, unknown>)?.hasTermWiseScores === 'Yes';
      const termsList = (entry as Record<string, unknown>)?.terms as any[];

      if (hasTermWise && (!Array.isArray(termsList) || termsList.length === 0)) {
        // Initialize with Term 1
        const initialTermSubjects = Array.from({ length: minSubjects }, () => ({
          _id: nanoid(),
          ...Object.fromEntries(
            (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
          ),
        }));

        setTermSubjectRowsByGrade((prev) => {
          const gradeTerms = prev[grade] || {};
          return {
            ...prev,
            [grade]: {
              ...gradeTerms,
              [0]: initialTermSubjects,
            },
          };
        });

        const initialTerm = {
          termName: 'Term 1',
          subjects: initialTermSubjects.map(({ _id, ...fields }) => fields),
        };

        form.setValue(
          `${sectionType}.${idx}.terms` as keyof Record<string, unknown>,
          [initialTerm] as never,
          { shouldDirty: true }
        );
      }
    });
  }, [watchedSectionData, gradesToShow, sectionType, minSubjects, section.repeatables?.fields, form]);

  // Add a subject row to a specific grade
  const handleAddSubjectRow = (grade: number, schoolIdx: number): void => {
    const newRow = {
      _id: nanoid(),
      ...Object.fromEntries(
        (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
      ),
    };

    setSubjectRowsByGrade((prev) => ({
      ...prev,
      [grade]: [...(prev[grade] ?? []), newRow],
    }));

    const subjectsFieldName = section.repeatables?.name ?? 'subjects';
    const currentSubjects = form.getValues(
      `${sectionType}.${schoolIdx}.${subjectsFieldName}`
    ) as SubjectRows | undefined;
    const newSubjectIdx = Array.isArray(currentSubjects)
      ? currentSubjects.length
      : 0;

    setTimeout(() => {
      section.repeatables?.fields.forEach((fieldId: string) => {
        form.setValue(
          `${sectionType}.${schoolIdx}.${subjectsFieldName}.${newSubjectIdx}.${fieldId}` as keyof Record<
            string,
            unknown
          >,
          '' as never
        );
      });
    }, 0);
  };

  // Remove a subject row from a specific grade
  const handleRemoveSubjectRow = (
    grade: number,
    schoolIdx: number,
    rowIdx: number
  ): void => {
    const currentRows = subjectRowsByGrade[grade] ?? [];
    if (currentRows.length <= minSubjects) return;

    setSubjectRowsByGrade((prev) => ({
      ...prev,
      [grade]: (prev[grade] ?? []).filter((_, i) => i !== rowIdx),
    }));

    const subjectsFieldName = section.repeatables?.name ?? 'subjects';
    const currentSubjects = form.getValues(
      `${sectionType}.${schoolIdx}.${subjectsFieldName}`
    ) as SubjectRows | undefined;

    if (Array.isArray(currentSubjects)) {
      const updatedSubjects = currentSubjects.filter((_, i) => i !== rowIdx);

      form.setValue(
        `${sectionType}.${schoolIdx}.${subjectsFieldName}` as keyof Record<
          string,
          unknown
        >,
        updatedSubjects as never,
        { shouldDirty: true }
      );

      updatedSubjects.forEach((subject, newIdx) => {
        section.repeatables?.fields.forEach((fieldId: string) => {
          const value = subject[fieldId];
          form.setValue(
            `${sectionType}.${schoolIdx}.${subjectsFieldName}.${newIdx}.${fieldId}` as keyof Record<
              string,
              unknown
            >,
            (value ?? '') as never
          );
        });
      });

      const lastIdx = currentSubjects.length - 1;
      section.repeatables?.fields.forEach((fieldId: string) => {
        form.unregister(
          `${sectionType}.${schoolIdx}.${subjectsFieldName}.${lastIdx}.${fieldId}` as keyof Record<
            string,
            unknown
          >
        );
      });
    }
  };

  // Add a term to a specific grade
  const handleAddTerm = (grade: number, schoolIdx: number): void => {
    const currentTerms = (form.getValues(`${sectionType}.${schoolIdx}.terms`) as unknown as any[]) || [];
    if (currentTerms.length >= 4) return;

    const nextTermIdx = currentTerms.length;
    const termLabel = `Term ${nextTermIdx + 1}`;

    const newTermSubjects = Array.from({ length: minSubjects }, () => ({
      _id: nanoid(),
      ...Object.fromEntries(
        (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
      ),
    }));

    setTermSubjectRowsByGrade((prev) => {
      const gradeTerms = prev[grade] || {};
      return {
        ...prev,
        [grade]: {
          ...gradeTerms,
          [nextTermIdx]: newTermSubjects,
        },
      };
    });

    const newTermData = {
      termName: termLabel,
      subjects: newTermSubjects.map(({ _id, ...fields }) => fields),
    };

    const updatedTerms = [...currentTerms, newTermData];
    form.setValue(
      `${sectionType}.${schoolIdx}.terms` as keyof Record<string, unknown>,
      updatedTerms as never,
      { shouldDirty: true }
    );
  };

  // Remove a term from a specific grade
  const handleRemoveTerm = (grade: number, schoolIdx: number, termIdx: number): void => {
    const currentTerms = (form.getValues(`${sectionType}.${schoolIdx}.terms`) as unknown as any[]) || [];
    if (currentTerms.length <= 1 || termIdx === 0) return;

    setTermSubjectRowsByGrade((prev) => {
      const gradeTerms = { ...(prev[grade] || {}) };
      const nextGradeTerms: Record<number, SubjectRows> = {};
      Object.keys(gradeTerms).forEach((key) => {
        const k = parseInt(key, 10);
        if (k < termIdx) {
          nextGradeTerms[k] = gradeTerms[k];
        } else if (k > termIdx) {
          nextGradeTerms[k - 1] = gradeTerms[k];
        }
      });
      return {
        ...prev,
        [grade]: nextGradeTerms,
      };
    });

    const updatedTerms = currentTerms.filter((_, i) => i !== termIdx);
    const renamedTerms = updatedTerms.map((t, idx) => ({
      ...t,
      termName: `Term ${idx + 1}`,
    }));

    form.setValue(
      `${sectionType}.${schoolIdx}.terms` as keyof Record<string, unknown>,
      renamedTerms as never,
      { shouldDirty: true }
    );
  };

  // Add subject row to a specific term of a grade
  const handleAddTermSubjectRow = (
    grade: number,
    schoolIdx: number,
    termIdx: number
  ): void => {
    const newRow = {
      _id: nanoid(),
      ...Object.fromEntries(
        (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
      ),
    };

    setTermSubjectRowsByGrade((prev) => {
      const gradeTerms = prev[grade] || {};
      const termRows = gradeTerms[termIdx] || [];
      return {
        ...prev,
        [grade]: {
          ...gradeTerms,
          [termIdx]: [...termRows, newRow],
        },
      };
    });

    const subjectsFieldName = section.repeatables?.name ?? 'subjects';
    const currentSubjects = form.getValues(
      `${sectionType}.${schoolIdx}.terms.${termIdx}.${subjectsFieldName}`
    ) as SubjectRows | undefined;
    const newSubjectIdx = Array.isArray(currentSubjects)
      ? currentSubjects.length
      : 0;

    setTimeout(() => {
      section.repeatables?.fields.forEach((fieldId: string) => {
        form.setValue(
          `${sectionType}.${schoolIdx}.terms.${termIdx}.${subjectsFieldName}.${newSubjectIdx}.${fieldId}` as keyof Record<
            string,
            unknown
          >,
          '' as never
        );
      });
    }, 0);
  };

  // Remove subject row from a specific term of a grade
  const handleRemoveTermSubjectRow = (
    grade: number,
    schoolIdx: number,
    termIdx: number,
    rowIdx: number
  ): void => {
    const currentRows = termSubjectRowsByGrade[grade]?.[termIdx] ?? [];
    if (currentRows.length <= minSubjects) return;

    setTermSubjectRowsByGrade((prev) => {
      const gradeTerms = prev[grade] || {};
      const termRows = gradeTerms[termIdx] || [];
      return {
        ...prev,
        [grade]: {
          ...gradeTerms,
          [termIdx]: termRows.filter((_, i) => i !== rowIdx),
        },
      };
    });

    const subjectsFieldName = section.repeatables?.name ?? 'subjects';
    const currentSubjects = form.getValues(
      `${sectionType}.${schoolIdx}.terms.${termIdx}.${subjectsFieldName}`
    ) as SubjectRows | undefined;

    if (Array.isArray(currentSubjects)) {
      const updatedSubjects = currentSubjects.filter((_, i) => i !== rowIdx);

      form.setValue(
        `${sectionType}.${schoolIdx}.terms.${termIdx}.${subjectsFieldName}` as keyof Record<
          string,
          unknown
        >,
        updatedSubjects as never,
        { shouldDirty: true }
      );

      updatedSubjects.forEach((subject, newIdx) => {
        section.repeatables?.fields.forEach((fieldId: string) => {
          const value = subject[fieldId];
          form.setValue(
            `${sectionType}.${schoolIdx}.terms.${termIdx}.${subjectsFieldName}.${newIdx}.${fieldId}` as keyof Record<
              string,
              unknown
            >,
            (value ?? '') as never
          );
        });
      });

      const lastIdx = currentSubjects.length - 1;
      section.repeatables?.fields.forEach((fieldId: string) => {
        form.unregister(
          `${sectionType}.${schoolIdx}.terms.${termIdx}.${subjectsFieldName}.${lastIdx}.${fieldId}` as keyof Record<
            string,
            unknown
          >
        );
      });
    }
  };

  const columns = section.columns ?? 1;

  // Watch all form values to reactively show/hide fields based on visibility config
  const formValues = useWatch({ control: form.control });
  const handleSameSchoolChecked = (checked: boolean, schoolIdx: number) => {
    if (!checked) return;

    const prevIndex = schoolIdx - 1;

    if (prevIndex < 0) return;

    const prevValues = form.getValues(`${sectionType}.${prevIndex}`);

    if (!prevValues) return;

    const excludeKeys = new Set([
      'yourTotalScore',
      'highestTotalScore',
      'overallPercentage',
      'maximumPossibleGPA',
      'subjects',
      'years',
    ]);
    Object.entries(prevValues as Record<string, unknown>).forEach(([key, value]) => {
      if (excludeKeys.has(key)) return;
      form.setValue(`${sectionType}.${schoolIdx}.${key}`, value as never, {
        shouldDirty: true,
      });
    });
  };
  return (
    <div>
      {gradesToShow.map((gradeForSchool, schoolIdx) => {
        const gradeLabel = `Grade ${gradeForSchool}`;
        const subjectRows = subjectRowsByGrade[gradeForSchool] ?? [];

        const sectionValues = (formValues as Record<string, unknown>)?.[sectionType];
        const schoolValues = Array.isArray(sectionValues)
          ? ((sectionValues[schoolIdx] as Record<string, unknown>) ?? {})
          : {};
        const hasTermWiseScores = schoolValues?.hasTermWiseScores as string | undefined;

        return (
          <div
            key={gradeForSchool}
            className="mb-6 flex flex-col space-y-2 rounded-xl border border-neutral-200 p-4"
          >
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <Label size="lg" className="font-semibold text-neutral-900">
                  {gradeLabel} Basic Details
                </Label>
                <TranscriptUploader targetSection="highSchool" targetIndex={schoolIdx} />
              </div>
              {schoolIdx > 0 && (
                <div className="mb-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      handleSameSchoolChecked(e.target.checked, schoolIdx)
                    }
                  />
                  <span className="text-sm text-neutral-700">
                    Same school as above?
                  </span>
                </div>
              )}
            </div>
            {/* Grade value stored via form.setValue in useEffect */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {section?.fields
                ?.filter((fieldId: string) => fieldId !== 'redFlags')
                .map((fieldId: string) => {
                  const fieldDef = fieldDefs.find((def) => def.id === fieldId);
                  if (!fieldDef) return null;
                  // Check field-level visibility (e.g., boardOther only when board === 'Others')
                  if (!isFieldVisible(fieldDef, schoolValues)) return null;
                  const controllerName = `${sectionType}.${schoolIdx}.${fieldDef.id}`;
                  const repeatableField: FieldDefinition = {
                    ...fieldDef,
                    id: controllerName,
                  };
                  return (
                    <div key={fieldDef.id}>
                      <Controller
                        name={controllerName}
                        control={form.control}
                        defaultValue={form.getValues(controllerName) ?? ''}
                        render={() => (
                          <FieldRenderer
                            field={repeatableField}
                            form={form}
                            error={errors[controllerName]}
                            inputHeightClass="py-2"
                            labelHeightClass="text-label-md"
                            inputWidthClass="w-full"
                          />
                        )}
                      />
                    </div>
                  );
                })}
            </div>
            <hr
              className="my-10 border-t border-neutral-200"
              aria-hidden="true"
            />
            {hasTermWiseScores === 'Yes' ? (
              <div className="space-y-6">
                {(() => {
                  const terms = (schoolValues?.terms ?? []) as any[];

                  return (
                    <>
                      {terms.map((term, termIdx) => {
                        const termLabel = term.termName || `Term ${termIdx + 1}`;
                        const termSubjectRows = termSubjectRowsByGrade[gradeForSchool]?.[termIdx] ?? [];
                        const termSubjects = term?.subjects as any[];

                        // Check if any subject in this term has 'Other' selected
                        const hasOtherSubject = Array.isArray(termSubjects) && termSubjects.some((s) => s.subject === 'Other');

                        // Filter fields to exclude 'subjectOther' if no 'Other' subject exists
                        const visibleFields =
                          section.repeatables?.fields.filter((fieldId: string) => {
                            if (fieldId === 'subjectOther') {
                              return hasOtherSubject;
                            }
                            return true;
                          }) ?? [];

                        return (
                          <div
                            key={termIdx}
                            className="rounded-lg border border-neutral-100 p-4 bg-neutral-50/50 space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <Label size="md" className="font-semibold text-neutral-800">
                                {gradeLabel} - {termLabel} Subject Details
                              </Label>
                              <div className="flex items-center gap-3">
                                <TranscriptUploader targetSection="highSchool" targetIndex={schoolIdx} />
                                {termIdx > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    label="Remove Term"
                                    className="text-red-500 hover:text-red-700 font-medium"
                                    onClick={() => handleRemoveTerm(gradeForSchool, schoolIdx, termIdx)}
                                  />
                                )}
                              </div>
                            </div>
                            <p className="text-label-sm text-neutral-600">
                              *All grades are required.
                            </p>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="border-b border-neutral-200">
                                    {visibleFields.map((fieldId: string) => {
                                      const fieldDef = fieldDefs.find(
                                        (def) => def.id === fieldId
                                      );
                                      if (!fieldDef) return null;
                                      return (
                                        <th
                                          key={fieldId}
                                          className="text-label-md px-4 py-3 text-left font-semibold text-neutral-900"
                                        >
                                          {fieldDef.label}
                                          {fieldDef.required && (
                                            <span className="ml-1 text-orange-500">*</span>
                                          )}
                                        </th>
                                      );
                                    })}
                                    <th className="text-label-md px-4 py-3 text-right font-semibold text-neutral-900">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {termSubjectRows.map((row, rowIdx) => {
                                    // Get the subject value for this row from termSubjects
                                    const subjectValue = termSubjects?.[rowIdx]?.subject as string | undefined;
                                    const showSubjectOther = subjectValue === 'Other';

                                    // Collect subjects already selected in OTHER rows
                                    const alreadySelectedSubjects = termSubjectRows.reduce<string[]>((acc, _, otherIdx) => {
                                      if (otherIdx === rowIdx) return acc;
                                      const otherSubject = form.getValues(
                                        `${section.type}.${schoolIdx}.terms.${termIdx}.subjects.${otherIdx}.subject`
                                      ) as string | undefined;
                                      if (otherSubject && otherSubject !== 'Other' && otherSubject.trim() !== '') {
                                        acc.push(otherSubject);
                                      }
                                      return acc;
                                    }, []);

                                    // Get the board value
                                    const boardValue = schoolValues?.board as string | undefined;
                                    const boardSubjectMap: Record<string, string[]> = {
                                      'American (AP / US High School Diploma)': americanSubjects,
                                      'Cambridge - A Levels': cambridgeALevelSubjects,
                                      'Cambridge - IGCSE': cambridgeIGCSESubjects,
                                      CBSE: cbseSubjects,
                                      HSC: hscSubjects,
                                      IBCP: ibcpSubjects,
                                      ICSE: icseSubjects,
                                      'International Baccalaureate (IB)': ibSubjects,
                                      ISC: iscSubjects,
                                      MYP: mypSubjects,
                                      NIOS: niosSubjects,
                                      'State Board': stateBoardSubjects,
                                    };

                                    const currentBoardSubjects = (boardValue && boardSubjectMap[boardValue]) || seniorSecondarySubjects;

                                    return (
                                      <tr
                                        key={(row._id as string) ?? rowIdx}
                                        className="border-b border-neutral-200"
                                      >
                                        {visibleFields.map((fieldId: string) => {
                                          const fieldDef = fieldDefs.find((def) => def.id === fieldId);
                                          if (!fieldDef) return null;

                                          if (fieldId === 'subjectOther' && !showSubjectOther) {
                                            return (
                                              <td key={fieldId} className="px-4 py-3">
                                                <span className="text-neutral-400">-</span>
                                              </td>
                                            );
                                          }

                                          const controllerName = `${section.type}.${schoolIdx}.terms.${termIdx}.subjects.${rowIdx}.${fieldId}`;
                                          const subjectsToShow = fieldId === 'subject'
                                            ? currentBoardSubjects.filter((opt) => opt === 'Other' || !alreadySelectedSubjects.includes(opt))
                                            : undefined;
                                          const fieldForRenderer: FieldDefinition = {
                                            ...fieldDef,
                                            id: controllerName,
                                            label: '',
                                          };

                                          return (
                                            <td key={controllerName} className="px-4 py-3">
                                              <Controller
                                                name={controllerName}
                                                control={form.control}
                                                defaultValue={form.getValues(controllerName) ?? ''}
                                                render={() => (
                                                  <FieldRenderer
                                                    field={fieldForRenderer}
                                                    form={form}
                                                    error={errors[controllerName]}
                                                    inputHeightClass="py-2"
                                                    labelHeightClass="text-label-md"
                                                    inputWidthClass="w-full"
                                                    optionsOverride={subjectsToShow}
                                                  />
                                                )}
                                              />
                                            </td>
                                          );
                                        })}
                                        <td className="px-4 py-3 text-right">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            type="button"
                                            label="Remove"
                                            className="text-blue-500"
                                            onClick={() => handleRemoveTermSubjectRow(gradeForSchool, schoolIdx, termIdx, rowIdx)}
                                            disabled={termSubjectRows.length <= minSubjects}
                                          />
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <button
                              type="button"
                              className="text-label-sm mt-2 cursor-pointer self-start font-medium text-blue-500"
                              onClick={() => handleAddTermSubjectRow(gradeForSchool, schoolIdx, termIdx)}
                            >
                              + Add Subject
                            </button>
                          </div>
                        );
                      })}
                      {terms.length < 4 && (
                        <button
                          type="button"
                          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-500/30 bg-white px-4 py-2 text-label-md font-semibold text-blue-600 shadow-xs transition-all hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-700 hover:shadow-sm active:bg-blue-100 self-start cursor-pointer"
                          onClick={() => handleAddTerm(gradeForSchool, schoolIdx)}
                        >
                          + Add Term
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <>
                {/* Subjects Section */}
                <div className="flex items-center justify-between">
                  <Label size="lg" className="font-semibold text-neutral-900">
                    {gradeLabel} Subject Details
                  </Label>
                  <TranscriptUploader targetSection="highSchool" targetIndex={schoolIdx} />
                </div>
                <p className="text-label-sm text-neutral-600">
                  *All grades are required.
                </p>
                <div className="mt-5 overflow-x-auto">
                  {(() => {
                    const schoolSubjects = schoolValues?.[section.repeatables?.name ?? 'subjects'] as any[];

                    // Check if any subject in this school has 'Other' selected
                    const hasOtherSubject = Array.isArray(schoolSubjects) && schoolSubjects.some((s) => s.subject === 'Other');

                    // Filter fields to exclude 'subjectOther' if no 'Other' subject exists
                    const visibleFields =
                      section.repeatables?.fields.filter((fieldId: string) => {
                        if (fieldId === 'subjectOther') {
                          return hasOtherSubject;
                        }
                        return true;
                      }) ?? [];

                    return (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-200">
                            {visibleFields.map((fieldId: string) => {
                              const fieldDef = fieldDefs.find(
                                (def) => def.id === fieldId
                              );
                              if (!fieldDef) return null;
                              return (
                                <th
                                  key={fieldId}
                                  className="text-label-md px-4 py-3 text-left font-semibold text-neutral-900"
                                >
                                  {fieldDef.label}
                                  {fieldDef.required && (
                                    <span className="ml-1 text-orange-500">*</span>
                                  )}
                                </th>
                              );
                            })}
                            <th className="text-label-md px-4 py-3 text-right font-semibold text-neutral-900">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {subjectRows.map((row, rowIdx) => {
                            // Get the subject value for this row from schoolSubjects
                            const subjectValue = schoolSubjects?.[rowIdx]?.subject as string | undefined;
                            const showSubjectOther = subjectValue === 'Other';

                            // Collect subjects already selected in OTHER rows
                            const alreadySelectedSubjects = subjectRows.reduce<string[]>((acc, _, otherIdx) => {
                              if (otherIdx === rowIdx) return acc;
                              const otherSubject = form.getValues(
                                `${section.type}.${schoolIdx}.${section.repeatables?.name}.${otherIdx}.subject`
                              ) as string | undefined;
                              if (otherSubject && otherSubject !== 'Other' && otherSubject.trim() !== '') {
                                acc.push(otherSubject);
                              }
                              return acc;
                            }, []);

                            return (
                              <tr
                                key={(row._id as string) ?? rowIdx}
                                className="border-b border-neutral-200"
                              >
                                {visibleFields.map((fieldId: string) => {
                                  const fieldDef = fieldDefs.find(
                                    (def) => def.id === fieldId
                                  );
                                  if (!fieldDef) return null;

                                  // For subjectOther field, only render if this row has 'Other' selected
                                  if (
                                    fieldId === 'subjectOther' &&
                                    !showSubjectOther
                                  ) {
                                    return (
                                      <td key={fieldId} className="px-4 py-3">
                                        <span className="text-neutral-400">-</span>
                                      </td>
                                    );
                                  }

                                  // Get the board value for this school
                                  const boardValue = schoolValues?.board as string | undefined;

                                  // Map board names to subject lists
                                  const boardSubjectMap: Record<string, string[]> = {
                                    'American (AP / US High School Diploma)': americanSubjects,
                                    'Cambridge - A Levels': cambridgeALevelSubjects,
                                    'Cambridge - IGCSE': cambridgeIGCSESubjects,
                                    CBSE: cbseSubjects,
                                    HSC: hscSubjects,
                                    IBCP: ibcpSubjects,
                                    ICSE: icseSubjects,
                                    'International Baccalaureate (IB)': ibSubjects,
                                    ISC: iscSubjects,
                                    MYP: mypSubjects,
                                    NIOS: niosSubjects,
                                    'State Board': stateBoardSubjects,
                                  };

                                  const currentBoardSubjects =
                                    (boardValue && boardSubjectMap[boardValue]) || seniorSecondarySubjects;

                                  const controllerName = `${section.type}.${schoolIdx}.${section.repeatables?.name}.${rowIdx}.${fieldDef.id}`;

                                  // For subject field, filter out subjects already selected in other rows
                                  const subjectsToShow = fieldId === 'subject'
                                    ? currentBoardSubjects.filter(
                                      (opt) => opt === 'Other' || !alreadySelectedSubjects.includes(opt)
                                    )
                                    : undefined;

                                  const fieldForRenderer: FieldDefinition = {
                                    ...fieldDef,
                                    id: controllerName,
                                    label: '', // Remove label in table cells
                                  };

                                  return (
                                    <td key={controllerName} className="px-4 py-3">
                                      <Controller
                                        name={controllerName}
                                        control={form.control}
                                        defaultValue={
                                          form.getValues(controllerName) ?? ''
                                        }
                                        render={() => (
                                          <FieldRenderer
                                            field={fieldForRenderer}
                                            form={form}
                                            error={errors[controllerName]}
                                            inputHeightClass="py-2"
                                            labelHeightClass="text-label-md"
                                            inputWidthClass="w-full"
                                            optionsOverride={subjectsToShow}
                                          />
                                        )}
                                      />
                                    </td>
                                  );
                                })}
                                <td className="px-4 py-3 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    label="Remove"
                                    className="text-blue-500"
                                    onClick={() =>
                                      handleRemoveSubjectRow(
                                        gradeForSchool,
                                        schoolIdx,
                                        rowIdx
                                      )
                                    }
                                    disabled={subjectRows.length <= minSubjects}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
                {/* Show array-level subjects error (e.g. "At least 3 subjects required") */}
                {errors[
                  `${sectionType}.${schoolIdx}.${section.repeatables?.name ?? 'subjects'}`
                ] && (
                    <p className="mt-1 text-sm text-red-500">
                      {
                        errors[
                        `${sectionType}.${schoolIdx}.${section.repeatables?.name ?? 'subjects'}`
                        ]
                      }
                    </p>
                  )}
                <button
                  type="button"
                  className="text-label-sm mt-2 cursor-pointer self-start font-medium text-blue-500"
                  onClick={() => handleAddSubjectRow(gradeForSchool, schoolIdx)}
                >
                  {section.repeatables?.repeatable_option?.add ?? '+ Add Subject'}
                </button>
              </>
            )}
            <hr className="mt-5 mb-10 border-t border-neutral-200" />
            <Label size="lg" className="font-semibold text-neutral-900">
              {gradeLabel} Other Details
            </Label>
            <div
              className="mt-5 grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {section?.fields
                ?.filter((fieldId: string) => ['redFlags'].includes(fieldId))
                .map((fieldId: string) => {
                  const fieldDef = fieldDefs.find((def) => def.id === fieldId);
                  if (!fieldDef) return null;
                  const controllerName = `${sectionType}.${schoolIdx}.${fieldDef.id}`;
                  const repeatableField: FieldDefinition = {
                    ...fieldDef,
                    id: controllerName,
                  };
                  return (
                    <div key={fieldDef.id}>
                      <Controller
                        name={controllerName}
                        control={form.control}
                        defaultValue={form.getValues(controllerName) ?? ''}
                        render={() => (
                          <FieldRenderer
                            field={repeatableField}
                            form={form}
                            error={errors[controllerName]}
                            inputHeightClass="py-2"
                            labelHeightClass="text-label-md"
                            inputWidthClass="w-full"
                          />
                        )}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })}
      {gradesToShow.length === 0 && (
        <p className="text-label-sm text-neutral-400">
          Please answer the question above to see grade score sections.
        </p>
      )}
    </div>
  );
};
