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
      const existingYears = Array.isArray(existingDegrees) && existingDegrees[idx]
        ? (existingDegrees[idx] as Record<string, unknown>)[yearsFieldName]
        : null;
      const yearsCount = Array.isArray(existingYears)
        ? existingYears.length
        : Math.max(minYears, 1);

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
      degree.yearRows.forEach((_, yearIdx) => {
        const yearFieldPath = `${sectionType}.${degreeIdx}.${yearsFieldName}.${yearIdx}.year`;
        const currentValue = form.getValues(yearFieldPath);
        // Only set if not already set or different
        if (currentValue !== yearIdx + 1) {
          form.setValue(yearFieldPath, yearIdx + 1);
        }

        // Pre-fill fields that have defaultValueFrom
        (section.repeatables?.fields ?? []).forEach((fid: string) => {
          const field = fieldDefs.find((f) => f.id === fid);
          if (field?.defaultValueFrom) {
            const targetPath = `${sectionType}.${degreeIdx}.${yearsFieldName}.${yearIdx}.${fid}`;
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

  useEffect(() => {
    if (!Array.isArray(watchedSectionData) || watchedSectionData.length === 0) return;
    
    console.log(`[GraduateBlock] ${sectionType} watched data changed:`, watchedSectionData);

    setDegrees((prev) => {
      let changed = false;
      const next: DegreeInstance[] = [];

      watchedSectionData.forEach((formDegree, idx) => {
        const currentDegree = prev[idx];
        const formYears = (formDegree as Record<string, unknown>)?.[yearsFieldName] as any[];
        
        // If form has years, use that count, else use show_default or min
        const yearsCount = Array.isArray(formYears) && formYears.length > 0 
          ? formYears.length 
          : Math.max(minYears, 1);

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

        if (!currentDegree || currentDegree.yearRows.length !== newYearRows.length) {
          changed = true;
        }
        next.push(newDegree);
      });

      if (prev.length !== next.length) changed = true;

      return changed ? next : prev;
    });
  }, [watchedSectionData, yearsFieldName, minYears, section.repeatables?.fields]);

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
    
    // Clear form values for this degree
    const degreeFields = section.fields ?? [];
    degreeFields.forEach((fieldId: string) => {
      form.setValue(`${sectionType}.${degreeIdx}.${fieldId}` as any, undefined as any);
    });
    
    // Clear year values for this degree
    const currentYears = degrees.find((d) => d.key === key)?.yearRows ?? [];
    currentYears.forEach((_, yearIdx) => {
      (section.repeatables?.fields ?? []).forEach((fieldId: string) => {
        form.setValue(`${sectionType}.${degreeIdx}.${yearsFieldName}.${yearIdx}.${fieldId}` as any, undefined as any);
      });
      form.setValue(`${sectionType}.${degreeIdx}.${yearsFieldName}.${yearIdx}.year` as any, undefined as any);
    });
    
    setDegrees((prev) => prev.filter((degree) => degree.key !== key));
  };

  // Add a year row to a specific degree
  const handleAddYear = (degreeIdx: number): void => {
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

    setDegrees((prev) =>
      prev.map((degree, idx) =>
        idx === degreeIdx
          ? {
              ...degree,
              yearRows: [
                ...degree.yearRows,
                Object.fromEntries(
                  (section.repeatables?.fields ?? []).map((fid: string) => [
                    fid,
                    getInitialValue(fid),
                  ])
                ),
              ],
            }
          : degree
      )
    );
  };

  // Remove a year row from a specific degree
  const handleRemoveYear = (degreeIdx: number, yearIdx: number): void => {
    const degree = degrees[degreeIdx];
    if (!degree || degree.yearRows.length <= minYears) return;
    
    // Clear form values for this year
    (section.repeatables?.fields ?? []).forEach((fieldId: string) => {
      form.setValue(`${sectionType}.${degreeIdx}.${yearsFieldName}.${yearIdx}.${fieldId}` as any, undefined as any);
    });
    form.setValue(`${sectionType}.${degreeIdx}.${yearsFieldName}.${yearIdx}.year` as any, undefined as any);
    
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
      {degrees.map((degree, degreeIdx) => (
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
          <Label size="lg" className="font-semibold text-neutral-900">
            Degree {degreeIdx + 1} - Year-wise Score Details
          </Label>
          
          <div
            className="mt-5 grid gap-4"
            style={{
              gridTemplateColumns: `auto ${getGridTemplateColumns(section.repeatables?.fields ?? [])} 100px`,
            }}
          >
            {degree.yearRows.map((_, yearIdx) => (
              <React.Fragment key={yearIdx}>
                {/* Year label */}
                <div className="flex items-center">
                  <Label size="md" className="font-medium text-neutral-700">
                    {getOrdinalSuffix(yearIdx + 1)} Year
                  </Label>
                </div>
                
                {/* Year fields */}
                {section.repeatables?.fields.map((fieldId: string) => {
                  const fieldDef = fieldDefs.find((def) => def.id === fieldId);
                  if (!fieldDef) return null;
                  const controllerName = `${sectionType}.${degreeIdx}.${yearsFieldName}.${yearIdx}.${fieldDef.id}`;
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
                <div className="flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    label="Remove"
                    className="text-blue-500"
                    onClick={() => handleRemoveYear(degreeIdx, yearIdx)}
                    disabled={degree.yearRows.length <= minYears}
                  />
                </div>
              </React.Fragment>
            ))}
          </div>

          <button
            type="button"
            className="text-label-sm mt-2 cursor-pointer self-start font-medium text-blue-500"
            onClick={() => handleAddYear(degreeIdx)}
          >
            + Add Year
          </button>

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
      ))}

      <button
        type="button"
        className="text-label-sm mt-2 cursor-pointer self-start font-medium text-blue-500"
        onClick={() => handleAddDegree()}
      >
        + Add Degree
      </button>
    </div>
  );
};
