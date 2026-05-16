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

/** Returns the list of grades to display in descending order (always 2 grades) */
const computeGradesToShow = (
  selectedGrade: number,
  hasCurrentGradeScores: string | undefined
): number[] => {
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
    () => computeGradesToShow(selectedGrade, hasCurrentGradeScores),
    [selectedGrade, hasCurrentGradeScores]
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

        // Snapshot data for any valid grade found in the form data.
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
    const initialGrades = computeGradesToShow(
      selectedGrade,
      hasCurrentGradeScores
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
                  const sectionValues = (
                    formValues as Record<string, unknown>
                  )?.[sectionType];
                  const schoolValues = Array.isArray(sectionValues)
                    ? ((sectionValues[schoolIdx] as Record<string, unknown>) ??
                      {})
                    : {};
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
            {/* Subjects Section */}
            <Label size="lg" className="font-semibold text-neutral-900">
              {gradeLabel} Subject Details
            </Label>
            <p className="text-label-sm text-neutral-600">
              *All grades are required.
            </p>
            <div className="mt-5 overflow-x-auto">
              {(() => {
                // Check if any subject in this school has 'Other' selected
                const hasOtherSubject = subjectRows.some((_, rowIdx) => {
                  const subjectValue = form.watch(
                    `${section.type}.${schoolIdx}.${section.repeatables?.name}.${rowIdx}.subject`
                  ) as string | undefined;
                  return subjectValue === 'Other';
                });

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
                        // Watch the subject value for this row to conditionally show subjectOther
                        const subjectValue = form.watch(
                          `${section.type}.${schoolIdx}.${section.repeatables?.name}.${rowIdx}.subject`
                        ) as string | undefined;
                        const showSubjectOther = subjectValue === 'Other';

                        // Collect subjects already selected in OTHER rows (exclude 'Other' since multiple custom subjects are allowed)
                        const alreadySelectedSubjects = subjectRows.reduce<
                          string[]
                        >((acc, _, otherIdx) => {
                          if (otherIdx === rowIdx) return acc;
                          const otherSubject = form.getValues(
                            `${section.type}.${schoolIdx}.${section.repeatables?.name}.${otherIdx}.subject`
                          ) as string | undefined;
                          if (
                            otherSubject &&
                            otherSubject !== 'Other' &&
                            otherSubject.trim() !== ''
                          ) {
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

                              const controllerName = `${section.type}.${schoolIdx}.${section.repeatables?.name}.${rowIdx}.${fieldDef.id}`;
                              // For subject field, filter out subjects already selected in other rows
                              const filteredFieldDef: FieldDefinition =
                                fieldId === 'subject' && fieldDef.options
                                  ? {
                                      ...fieldDef,
                                      id: controllerName,
                                      label: '',
                                      options: fieldDef.options.filter(
                                        (opt) =>
                                          !alreadySelectedSubjects.includes(opt)
                                      ),
                                    }
                                  : {
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
                                        field={filteredFieldDef}
                                        form={form}
                                        error={errors[controllerName]}
                                        inputHeightClass="py-2"
                                        labelHeightClass="text-label-md"
                                        inputWidthClass="w-full"
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
