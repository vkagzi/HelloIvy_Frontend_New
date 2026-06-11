'use client';

import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { Controller, UseFormReturn, useWatch } from 'react-hook-form';
import Button from '@/app/_components/Button';
import { FieldRenderer } from '@/app/_components/dynamic-form/FieldRenderer';
import { LayoutItem } from '@/app/_components/dynamic-form/types/type';
import { FieldDefinition } from '@/app/utils/dynamicForm';
import { Label } from '@/app/_components/Typography';
import TranscriptUploader from '@/app/_components/TranscriptUploader';
import { UNDERGRADUATE_DEGREE_PROGRAMS, POSTGRADUATE_DEGREE_PROGRAMS } from '@/app/(saas)/profile/_config/fieldDefinitions';
import { isFieldVisible } from '@/app/_components/dynamic-form/utils/utils';

interface GraduateBlockProps {
  section: LayoutItem;
  sectionType: string;
  fieldDefs: FieldDefinition[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  errors: Record<string, string>;
}

type YearRow = Record<string, unknown>;

interface DegreeInstance {
  key: string;
  yearRows: YearRow[];
}

const computeYearsToShow = (
  sectionType: string,
  gradeLevel: string | undefined,
  hasCurrentGradeScores: string | undefined,
  hasSemesterWiseScores: string | undefined
): number => {
  const isCurrentBlock = ['undergraduate', 'postgraduate', 'tenPlus'].includes(sectionType);
  if (!isCurrentBlock) {
    return -1; // -1 means do not force/slice years
  }

  if (!hasCurrentGradeScores || !['Yes', 'No'].includes(hasCurrentGradeScores)) {
    return 0; // 0 means do not show score details
  }

  const gradeLevelStr = gradeLevel ? String(gradeLevel) : '';
  const parsedYear = parseInt(gradeLevelStr.replace('Year ', ''), 10);
  if (isNaN(parsedYear)) {
    return 0;
  }

  const years = hasCurrentGradeScores === 'Yes' ? parsedYear : parsedYear - 1;
  const multiplier = hasSemesterWiseScores === 'Yes' ? 2 : 1;
  return years * multiplier;
};

export const GraduateBlock: React.FC<GraduateBlockProps> = ({
  section,
  sectionType,
  fieldDefs,
  form,
  errors,
}) => {
  const minDegrees = 1;
  const minYears = section.repeatables?.repeatable_option?.min ?? 1;
  const yearsFieldName = section.repeatables?.name ?? 'years';

  // Watch top-level gradeLevel and hasCurrentGradeScores
  const gradeLevel = useWatch({ control: form.control, name: 'gradeLevel' }) as string | undefined;
  const hasCurrentGradeScores = useWatch({ control: form.control, name: 'hasCurrentGradeScores' }) as string | undefined;
  const isCurrentBlock = ['undergraduate', 'postgraduate', 'tenPlus'].includes(sectionType);

  // Helper to calculate grid template columns with field widths
  const getGridTemplateColumns = (fieldIds: string[]): string => {
    const widths = fieldIds.map((fid) => {
      const field = fieldDefs.find((f) => f.id === fid);
      return field?.width ?? 1;
    });
    return widths.map((w) => `${w}fr`).join(' ');
  };

  // Helper to get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + 'st';
    if (j === 2 && k !== 12) return num + 'nd';
    if (j === 3 && k !== 13) return num + 'rd';
    return num + 'th';
  };

  // Initialize degrees from existing form data
  const [degrees, setDegrees] = useState<DegreeInstance[]>(() => {
    // Check if there's existing degree data in the form
    const existingDegrees = form.getValues(sectionType) as unknown[];
    const existingCount = Array.isArray(existingDegrees) ? existingDegrees.length : 0;
    const initialCount = Math.max(minDegrees, existingCount);

    return Array.from({ length: initialCount }, (_, idx) => {
      const degreeData = Array.isArray(existingDegrees) && existingDegrees[idx]
        ? (existingDegrees[idx] as Record<string, unknown>)
        : {};
      
      const isSemWise = degreeData.hasSemesterWiseScores === 'Yes';
      const activeFieldName = isSemWise ? 'semesters' : yearsFieldName;
      const existingRows = degreeData[activeFieldName];
      
      let yearsCount = Array.isArray(existingRows)
        ? existingRows.length
        : Math.max(minYears, 1);

      // Safety cap for Years in initialization
      if (!isSemWise && yearsCount > 6) {
        yearsCount = 6;
      }

      // If current block, override yearsCount based on gradeLevel and hasCurrentGradeScores
      if (isCurrentBlock) {
        const computedCount = computeYearsToShow(
          sectionType,
          gradeLevel,
          hasCurrentGradeScores,
          degreeData.hasSemesterWiseScores as string
        );
        if (computedCount >= 0) {
          yearsCount = computedCount;
        }
      }

      return {
        key: nanoid(),
        yearRows: Array.from({ length: yearsCount }, () =>
          Object.fromEntries(
            (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
          )
        ),
      };
    });
  });

  // Set year values in form when degrees/years change
  useEffect(() => {
    degrees.forEach((degree, degreeIdx) => {
      const isSemWise = form.getValues(`${sectionType}.${degreeIdx}.hasSemesterWiseScores`) === 'Yes';
      const currentActiveFieldName = isSemWise ? 'semesters' : yearsFieldName;

      degree.yearRows.forEach((_, yearIdx) => {
        const yearFieldPath = `${sectionType}.${degreeIdx}.${currentActiveFieldName}.${yearIdx}.year`;
        const currentValue = form.getValues(yearFieldPath);
        // Only set if not already set or different
        if (currentValue !== yearIdx + 1) {
          form.setValue(yearFieldPath, yearIdx + 1);
        }

        // Pre-fill fields that have defaultValueFrom
        (section.repeatables?.fields ?? []).forEach((fid: string) => {
          const field = fieldDefs.find((f) => f.id === fid);
          if (field?.defaultValueFrom) {
            const targetPath = `${sectionType}.${degreeIdx}.${currentActiveFieldName}.${yearIdx}.${fid}`;
            const targetValue = form.getValues(targetPath) as unknown as string;
            if (!targetValue) {
              const sourceValue = form.getValues(
                `${sectionType}.${degreeIdx}.${field.defaultValueFrom}`
              ) as unknown as string;
              if (sourceValue) {
                form.setValue(targetPath, sourceValue);
              }
            }
          }
        });
      });
    });
  }, [degrees, form, sectionType, yearsFieldName, section.repeatables?.fields, fieldDefs]);

  // Sync internal state with form data changes (e.g. from resume scan / reset)
  const watchedSectionData = useWatch({
    control: form.control,
    name: sectionType as any,
  });

  const formValues = useWatch({ control: form.control });

  // Reactively resize form array when gradeLevel/hasCurrentGradeScores changes
  const watchedSectionDataStr = JSON.stringify(watchedSectionData);
  useEffect(() => {
    if (!isCurrentBlock) return;

    const currentSectionData = form.getValues(sectionType);
    if (!Array.isArray(currentSectionData)) return;

    let formChanged = false;
    const updatedSectionData = currentSectionData.map((degreeData, degreeIdx) => {
      if (!degreeData) return degreeData;
      const isSemWise = degreeData.hasSemesterWiseScores === 'Yes';
      const activeFieldName = isSemWise ? 'semesters' : yearsFieldName;
      const currentRows = degreeData[activeFieldName] as any[] ?? [];

      const computedCount = computeYearsToShow(
        sectionType,
        gradeLevel,
        hasCurrentGradeScores,
        degreeData.hasSemesterWiseScores as string
      );

      if (computedCount >= 0 && currentRows.length !== computedCount) {
        formChanged = true;
        // Truncate or expand the array
        let nextRows = [...currentRows];
        if (nextRows.length > computedCount) {
          nextRows = nextRows.slice(0, computedCount);
        } else {
          while (nextRows.length < computedCount) {
            nextRows.push(
              Object.fromEntries(
                (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
              )
            );
          }
        }
        return {
          ...degreeData,
          [activeFieldName]: nextRows,
        };
      }
      return degreeData;
    });

    if (formChanged) {
      form.setValue(sectionType, updatedSectionData, { shouldDirty: true });
    }
  }, [gradeLevel, hasCurrentGradeScores, isCurrentBlock, sectionType, yearsFieldName, section.repeatables?.fields, form, watchedSectionDataStr]);

  useEffect(() => {
    if (!Array.isArray(watchedSectionData) || watchedSectionData.length === 0) return;
    
    console.log(`[GraduateBlock] ${sectionType} watched data changed:`, watchedSectionData);

    setDegrees((prev) => {
      let changed = false;
      const next: DegreeInstance[] = [];

      watchedSectionData.forEach((formDegree, idx) => {
        const currentDegree = prev[idx];
        const rawHasSem = (formDegree as Record<string, unknown>)?.hasSemesterWiseScores;
        const semesters = (formDegree as Record<string, unknown>)?.semesters as any[];
        const years = (formDegree as Record<string, unknown>)?.years as any[];
        
        // Advanced Inference: If either array has 6, 8, or 10 items, it's almost certainly semesters.
        // We do this to ensure UI stays in sync with common transcript structures.
        const semCount = Array.isArray(semesters) ? semesters.length : 0;
        const yearCountActual = Array.isArray(years) ? years.length : 0;
        
        let isSemWise = rawHasSem === 'Yes';
        // Force semester mode if we have 8 or 10 items (clearly semesters) or if user said Yes
        if (semCount >= 8 || yearCountActual >= 8 || rawHasSem === 'Yes') {
          isSemWise = true;
        }

        const currentActiveFieldName = isSemWise ? 'semesters' : yearsFieldName;
        const formYears = (formDegree as Record<string, unknown>)?.[currentActiveFieldName] as any[];
        
        // Use data count if available, otherwise use defaults.
        // LIMIT: If in Year-wise mode (isSemWise: false), cap rows at 6 (max standard degree years).
        // This prevents the system from accidentally showing "8th Year" if state is messy.
        let yearsCount = Array.isArray(formYears) && formYears.length > 0 
          ? formYears.length 
          : Math.max(minYears, 1);

        if (!isSemWise && yearsCount > 6) {
          yearsCount = 6; // Safety cap for years
        }

        // Overwrite yearsCount if current block
        if (isCurrentBlock) {
          const computedCount = computeYearsToShow(
            sectionType,
            gradeLevel,
            hasCurrentGradeScores,
            isSemWise ? 'Yes' : 'No'
          );
          if (computedCount >= 0) {
            yearsCount = computedCount;
          }
        }

        const newYearRows = Array.from({ length: yearsCount }, (_, yIdx) => {
          const formYear = Array.isArray(formYears) ? formYears[yIdx] : {};
          return {
            ...Object.fromEntries((section.repeatables?.fields ?? []).map(fid => [fid, ''])),
            ...(formYear || {})
          };
        });

        const newDegree: DegreeInstance = {
          key: currentDegree?.key || nanoid(),
          yearRows: newYearRows
        };

        const subjectsChanged = newYearRows.some((row, yIdx) => {
          const currentRow = currentDegree?.yearRows[yIdx];
          if (!currentRow) return true;
          return Object.entries(row).some(([key, val]) => currentRow[key] !== val);
        });

        if (!currentDegree || currentDegree.yearRows.length !== newYearRows.length || subjectsChanged) {
          changed = true;
        }
        next.push(newDegree);
      });

      if (prev.length !== next.length) changed = true;

      return changed ? next : prev;
    });
  }, [watchedSectionData, sectionType, yearsFieldName, minYears, section.repeatables?.fields, gradeLevel, hasCurrentGradeScores, isCurrentBlock]);

  // Add a new degree block
  const handleAddDegree = (): void => {
    setDegrees((prev) => [
      ...prev,
      {
        key: nanoid(),
        yearRows: Array.from({ length: Math.max(minYears, 1) }, () =>
          Object.fromEntries(
            (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
          )
        ),
      },
    ]);
  };

  // Remove a degree block by key
  const handleRemoveDegree = (key: string, degreeIdx: number): void => {
    if (degrees.length <= minDegrees) return;
    
    // Get the current array and remove the item to preserve index integrity in react-hook-form
    const currentData = form.getValues(sectionType);
    if (Array.isArray(currentData)) {
      const nextData = currentData.filter((_, idx) => idx !== degreeIdx);
      form.setValue(sectionType, nextData, { shouldDirty: true, shouldValidate: true });
    }
    
    setDegrees((prev) => prev.filter((degree) => degree.key !== key));
  };

  // Add a year row to a specific degree
  const handleAddYear = (degreeIdx: number): void => {
    const degree = degrees[degreeIdx];
    if (!degree) return;

    const isSemesterWise = form.getValues(`${sectionType}.${degreeIdx}.hasSemesterWiseScores`) === 'Yes';
    if (isSemesterWise && degree.yearRows.length >= 8) return;

    const activeFieldName = isSemesterWise ? 'semesters' : yearsFieldName;

    // Pre-fill fields that have defaultValueFrom with the source value from the same degree
    const getInitialValue = (fid: string): string => {
      const field = fieldDefs.find((f) => f.id === fid);
      if (field?.defaultValueFrom) {
        const sourceValue = form.getValues(
          `${sectionType}.${degreeIdx}.${field.defaultValueFrom}`
        ) as unknown as string;
        if (sourceValue) return sourceValue;
      }
      return '';
    };

    const newRow = Object.fromEntries(
      (section.repeatables?.fields ?? []).map((fid: string) => [fid, getInitialValue(fid)])
    );

    // Update local state
    setDegrees((prev) =>
      prev.map((deg, idx) =>
        idx === degreeIdx
          ? { ...deg, yearRows: [...deg.yearRows, newRow] }
          : deg
      )
    );

    // Also update the form directly so data doesn't get lost on re-render
    const currentRows = (form.getValues(`${sectionType}.${degreeIdx}.${activeFieldName}`) as any[]) ?? [];
    form.setValue(`${sectionType}.${degreeIdx}.${activeFieldName}`, [...currentRows, newRow], { shouldDirty: true });
  };

  const handleRemoveYear = (degreeIdx: number, yearIdx: number): void => {
    const degree = degrees[degreeIdx];
    const isSemesterWise = form.getValues(`${sectionType}.${degreeIdx}.hasSemesterWiseScores`) === 'Yes';
    const minRows = isSemesterWise ? 1 : minYears;
    if (!degree || degree.yearRows.length <= minRows) return;
    
    // Update form data first to let index shifting happen correctly
    const currentSectionData = form.getValues(sectionType);
    if (Array.isArray(currentSectionData) && currentSectionData[degreeIdx]) {
      const degreeData = currentSectionData[degreeIdx];
      const isSemWise = degreeData.hasSemesterWiseScores === 'Yes';
      const currentActiveFieldName = isSemWise ? 'semesters' : yearsFieldName;
      const currentYears = degreeData[currentActiveFieldName];
      if (Array.isArray(currentYears)) {
        const nextYears = currentYears.filter((_, idx) => idx !== yearIdx);
        form.setValue(`${sectionType}.${degreeIdx}.${currentActiveFieldName}`, nextYears, { shouldDirty: true, shouldValidate: true });
      }
    }
    
    setDegrees((prev) =>
      prev.map((deg, idx) =>
        idx === degreeIdx
          ? {
              ...deg,
              yearRows: deg.yearRows.filter((_, i) => i !== yearIdx),
            }
          : deg
      )
    );
  };

  const columns = section.columns ?? 1;

  return (
    <div className="flex flex-col gap-7">
      {degrees.map((degree, degreeIdx) => {
        const sectionValues = (formValues as Record<string, unknown>)?.[sectionType];
        const degreeValues = Array.isArray(sectionValues)
          ? ((sectionValues[degreeIdx] as Record<string, unknown>) ?? {})
          : {};
        const hasSemesterWiseScores = degreeValues?.hasSemesterWiseScores as string | undefined;
        const activeYearsFieldName = hasSemesterWiseScores === 'Yes' ? 'semesters' : yearsFieldName;

        return (
          <div
            key={degree.key}
            className="flex flex-col space-y-2 rounded-xl border border-neutral-200 p-4"
          >
            {/* Degree Header */}
            <div className="mb-5 flex items-center justify-between">
              <Label size="lg" className="font-semibold text-neutral-900">
                Degree {degreeIdx + 1} - Basic Details
              </Label>
              <div className="flex items-center gap-3">
                <TranscriptUploader targetSection={sectionType} targetIndex={degreeIdx} />
                {degrees.length > minDegrees && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    label="Remove Degree"
                    className="text-blue-500"
                    onClick={() => handleRemoveDegree(degree.key, degreeIdx)}
                  />
                )}
              </div>
            </div>

            {/* Degree Fields */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {section?.fields
                ?.filter((fieldId: string) => !['redFlags'].includes(fieldId))
                .map((fieldId: string) => {
                  const fieldDef = fieldDefs.find((def) => def.id === fieldId);
                  if (!fieldDef) return null;

                  if (!isFieldVisible(fieldDef, degreeValues)) return null;

                  const controllerName = `${sectionType}.${degreeIdx}.${fieldDef.id}`;
                  const repeatableField: FieldDefinition = {
                    ...fieldDef,
                    id: controllerName,
                  };
                  const getOptionsOverride = (fid: string) => {
                    if (fid !== 'degree') return undefined;
                    if (sectionType === 'undergraduate' || sectionType === 'undergraduate_prereq') {
                      return UNDERGRADUATE_DEGREE_PROGRAMS;
                    }
                    if (sectionType === 'postgraduate') {
                      return POSTGRADUATE_DEGREE_PROGRAMS;
                    }
                    return undefined;
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
                            optionsOverride={getOptionsOverride(fieldDef.id)}
                          />
                        )}
                      />
                    </div>
                  );
                })}
            </div>

            <hr className="my-10 border-t border-neutral-200" aria-hidden="true" />

            {/* Year Score Details */}
            <div className="flex items-center justify-between">
              <Label size="lg" className="font-semibold text-neutral-900">
                {hasSemesterWiseScores === 'Yes'
                  ? `Degree ${degreeIdx + 1} - Semester-wise Score Details`
                  : `Degree ${degreeIdx + 1} - Year-wise Score Details`}
              </Label>
              <TranscriptUploader targetSection={sectionType} targetIndex={degreeIdx} />
            </div>
            
            {isCurrentBlock && (!hasCurrentGradeScores || !['Yes', 'No'].includes(hasCurrentGradeScores)) ? (
              <p className="text-label-sm text-neutral-400 mt-4">
                Please answer the question above to see year/semester score details.
              </p>
            ) : (
              <>
                <div
                  className="mt-5 grid gap-4"
                  style={{
                    gridTemplateColumns: isCurrentBlock
                      ? `auto ${getGridTemplateColumns(section.repeatables?.fields ?? [])}`
                      : `auto ${getGridTemplateColumns(section.repeatables?.fields ?? [])} 100px`,
                  }}
                >
                  {degree.yearRows.map((_, yearIdx) => (
                    <React.Fragment key={yearIdx}>
                      {/* Year label */}
                      <div className="flex items-center">
                        <Label size="md" className="font-medium text-neutral-700">
                          {getOrdinalSuffix(yearIdx + 1)} {hasSemesterWiseScores === 'Yes' ? 'Semester' : 'Year'}
                        </Label>
                      </div>
                      
                      {/* Year fields */}
                      {section.repeatables?.fields.map((fieldId: string) => {
                        const fieldDef = fieldDefs.find((def) => def.id === fieldId);
                        if (!fieldDef) return null;
                        const controllerName = `${sectionType}.${degreeIdx}.${activeYearsFieldName}.${yearIdx}.${fieldDef.id}`;
                        const repeatableField: FieldDefinition = {
                          ...fieldDef,
                          id: controllerName,
                        };
                        return (
                          <div key={controllerName}>
                            <Controller
                              key={controllerName} // Force re-render if name changes
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
                      
                      {/* Remove year button */}
                      {!isCurrentBlock && (
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            label="Remove"
                            className="text-blue-500"
                            onClick={() => handleRemoveYear(degreeIdx, yearIdx)}
                            disabled={
                              hasSemesterWiseScores === 'Yes'
                                ? degree.yearRows.length <= 1
                                : degree.yearRows.length <= minYears
                            }
                          />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {!isCurrentBlock && !(hasSemesterWiseScores === 'Yes' && degree.yearRows.length >= 8) && (
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-500/30 bg-white px-4 py-2 text-label-md font-semibold text-blue-600 shadow-xs transition-all hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-700 hover:shadow-sm active:bg-blue-100 self-start cursor-pointer"
                    onClick={() => handleAddYear(degreeIdx)}
                  >
                    {hasSemesterWiseScores === 'Yes' ? '+ Add Semester' : '+ Add Year'}
                  </button>
                )}
              </>
            )}

            <hr className="mt-5 mb-10 border-t border-neutral-200" aria-hidden="true" />

            {/* Other Details (redFlags) */}
            <Label size="lg" className="font-semibold text-neutral-900">
              Degree {degreeIdx + 1} - Other Details
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

                  if (!isFieldVisible(fieldDef, degreeValues)) return null;

                  const controllerName = `${sectionType}.${degreeIdx}.${fieldDef.id}`;
                  const repeatableField: FieldDefinition = {
                    ...fieldDef,
                    id: controllerName,
                  };
                  const getOptionsOverride = (fid: string) => {
                    if (fid !== 'degree') return undefined;
                    if (sectionType === 'undergraduate' || sectionType === 'undergraduate_prereq') {
                      return UNDERGRADUATE_DEGREE_PROGRAMS;
                    }
                    if (sectionType === 'postgraduate') {
                      return POSTGRADUATE_DEGREE_PROGRAMS;
                    }
                    return undefined;
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
                            optionsOverride={getOptionsOverride(fieldDef.id)}
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

      <button
        type="button"
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-500/30 bg-white px-4 py-2 text-label-md font-semibold text-blue-600 shadow-xs transition-all hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-700 hover:shadow-sm active:bg-blue-100 self-start cursor-pointer"
        onClick={() => handleAddDegree()}
      >
        + Add Degree
      </button>
    </div>
  );
};
