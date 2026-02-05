'use client';

import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { Controller, UseFormReturn, useWatch } from 'react-hook-form';
import Button from '@/app/_components/Button';
import { FieldRenderer } from '@/app/_components/dynamic-form/FieldRenderer';
import { LayoutItem } from '@/app/_components/dynamic-form/types/type';
import { FieldDefinition } from '@/app/utils/dynamicForm';
import { Label } from '@/app/_components/Typography';
import { isFieldVisible } from '@/app/_components/dynamic-form/utils/utils';

interface SchoolBlockProps {
  section: LayoutItem;
  sectionType: string;
  fieldDefs: FieldDefinition[];
  form: UseFormReturn<Record<string, unknown>>;
  errors: Record<string, string>;
  selectedGrade?: number;
}

type SubjectRows = Record<string, unknown>[];

interface SchoolInstance {
  key: string;
  subjectRows: SubjectRows;
}

export const SchoolBlock: React.FC<SchoolBlockProps> = ({
  section,
  sectionType,
  fieldDefs,
  form,
  errors,
  selectedGrade = 9,
}) => {
  const minSchools = 1;
  const minSubjects = section.repeatables?.repeatable_option?.min ?? 1;

  // Helper to get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + 'st';
    if (j === 2 && k !== 12) return num + 'nd';
    if (j === 3 && k !== 13) return num + 'rd';
    return num + 'th';
  };

  // Helper to calculate grid template columns with field widths
  const getGridTemplateColumns = (fieldIds: string[]): string => {
    const widths = fieldIds.map((fid) => {
      const field = fieldDefs.find((f) => f.id === fid);
      return field?.width ?? 1;
    });
    return widths.map((w) => `${w}fr`).join(' ');
  };

  // Array of school blocks, each with a unique key and its own subject rows
  const [schools, setSchools] = useState<SchoolInstance[]>(() => {
    // Check if there's existing school data in the form
    const existingSchools = form.getValues(sectionType) as unknown[];
    const existingCount = Array.isArray(existingSchools) ? existingSchools.length : 0;
    const initialCount = Math.max(minSchools, existingCount);

    // Start from (selectedGrade - 2) and go up in ascending order
    return Array.from({ length: initialCount }, (_, idx) => {
      const existingSubjects = Array.isArray(existingSchools) && existingSchools[idx]
        ? (existingSchools[idx] as Record<string, unknown>)[section.repeatables?.name ?? 'subjects']
        : null;
      const subjectsCount = Array.isArray(existingSubjects)
        ? existingSubjects.length
        : minSubjects;

      return {
        key: nanoid(),
        subjectRows: Array.from({ length: subjectsCount }, () => ({
          _id: nanoid(),
          ...Object.fromEntries(
            (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
          ),
        })),
      };
    });
  });

  // Add a new school block with prefilled values from the previous class
  const handleAddSchool = (): void => {
    const lastSchoolIdx = schools.length - 1;
    
    // Get the last class's grade and calculate 1 grade higher (ascending order)
    const lastGradeRaw = form.getValues(`${sectionType}.${lastSchoolIdx}.grade`);
    const parsedLastGrade = typeof lastGradeRaw === 'number' 
      ? lastGradeRaw 
      : typeof lastGradeRaw === 'string' 
        ? parseInt(lastGradeRaw, 10) 
        : undefined;
    // Validate grade is within reasonable range (1-12)
    const lastGrade = parsedLastGrade && !isNaN(parsedLastGrade) && parsedLastGrade >= 1 && parsedLastGrade <= 12 
      ? parsedLastGrade 
      : undefined;
    const newGrade = lastGrade ? lastGrade + 1 : selectedGrade - 2 + schools.length;
    
    // Get values from the last school to prefill
    const lastSchoolName = form.getValues(`${sectionType}.${lastSchoolIdx}.schoolName`) as string | undefined;
    const lastCity = form.getValues(`${sectionType}.${lastSchoolIdx}.city`) as string | undefined;
    const lastYearOfCompletion = form.getValues(`${sectionType}.${lastSchoolIdx}.yearOfCompletion`) as string | undefined;
    
    // Calculate year of completion as 1 year higher (ascending order)
    const newYearOfCompletion = lastYearOfCompletion 
      ? String(parseInt(lastYearOfCompletion, 10) + 1) 
      : '';
    
    // Get subjects from the last school
    const lastSubjects = form.getValues(`${sectionType}.${lastSchoolIdx}.${section.repeatables?.name}`) as SubjectRows | undefined;
    
    // Create new subject rows, prefilling subject names and highest possible score from the previous class
    const newSubjectRows = lastSubjects && Array.isArray(lastSubjects) && lastSubjects.length > 0
      ? lastSubjects.map((subj) => ({
          _id: nanoid(),
          ...Object.fromEntries(
            (section.repeatables?.fields ?? []).map((fid: string) => [
              fid,
              fid === 'subject' ? (subj.subject ?? '') : 
              fid === 'highestTotalScore' ? (subj.highestTotalScore ?? '') : '',
            ])
          ),
        }))
      : Array.from({ length: minSubjects }, () => ({
          _id: nanoid(),
          ...Object.fromEntries(
            (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
          ),
        }));
    
    const newSchoolIdx = schools.length;
    
    // Set the prefilled values for the new school block
    setTimeout(() => {
      form.setValue(`${sectionType}.${newSchoolIdx}.grade` as keyof Record<string, unknown>, newGrade as never);
      if (lastSchoolName) {
        form.setValue(`${sectionType}.${newSchoolIdx}.schoolName` as keyof Record<string, unknown>, lastSchoolName as never);
      }
      if (lastCity) {
        form.setValue(`${sectionType}.${newSchoolIdx}.city` as keyof Record<string, unknown>, lastCity as never);
      }
      if (newYearOfCompletion) {
        form.setValue(`${sectionType}.${newSchoolIdx}.yearOfCompletion` as keyof Record<string, unknown>, newYearOfCompletion as never);
      }
      // Prefill subject names and highest possible score
      if (lastSubjects && Array.isArray(lastSubjects)) {
        lastSubjects.forEach((subj, subjIdx) => {
          if (subj.subject) {
            form.setValue(
              `${sectionType}.${newSchoolIdx}.${section.repeatables?.name}.${subjIdx}.subject` as keyof Record<string, unknown>,
              subj.subject as never
            );
          }
          if (subj.highestTotalScore) {
            form.setValue(
              `${sectionType}.${newSchoolIdx}.${section.repeatables?.name}.${subjIdx}.highestTotalScore` as keyof Record<string, unknown>,
              subj.highestTotalScore as never
            );
          }
        });
      }
    }, 0);
    
    setSchools((prev) => [
      ...prev,
      {
        key: nanoid(),
        subjectRows: newSubjectRows,
      },
    ]);
  };

  // Remove a school block by key
  const handleRemoveSchool = (key: string): void => {
    if (schools.length <= minSchools) return;
    setSchools((prev) => prev.filter((school) => school.key !== key));
  };

  // Add a subject row to a specific school
  const handleAddSubjectRow = (schoolIdx: number): void => {
    const newRow = {
      _id: nanoid(),
      ...Object.fromEntries(
        (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
      ),
    };
    
    // Update local state
    setSchools((prev) =>
      prev.map((school, idx) =>
        idx === schoolIdx
          ? {
              ...school,
              subjectRows: [...school.subjectRows, newRow],
            }
          : school
      )
    );
    
    // Update form values: add new subject row
    const subjectsFieldName = section.repeatables?.name ?? 'subjects';
    const currentSubjects = form.getValues(`${sectionType}.${schoolIdx}.${subjectsFieldName}`) as SubjectRows | undefined;
    const newSubjectIdx = Array.isArray(currentSubjects) ? currentSubjects.length : 0;
    
    // Initialize form values for the new subject row
    setTimeout(() => {
      section.repeatables?.fields.forEach((fieldId: string) => {
        form.setValue(
          `${sectionType}.${schoolIdx}.${subjectsFieldName}.${newSubjectIdx}.${fieldId}` as keyof Record<string, unknown>,
          '' as never
        );
      });
    }, 0);
  };

  // Remove a subject row from a specific school
  const handleRemoveSubjectRow = (schoolIdx: number, rowIdx: number): void => {
    const school = schools[schoolIdx];
    if (!school || school.subjectRows.length <= minSubjects) return;

    // Update local state
    setSchools((prev) =>
      prev.map((s, idx) =>
        idx === schoolIdx
          ? {
              ...s,
              subjectRows: s.subjectRows.filter((_, i) => i !== rowIdx),
            }
          : s
      )
    );

    // Update form values: re-index all subjects after removal
    const subjectsFieldName = section.repeatables?.name ?? 'subjects';
    const currentSubjects = form.getValues(`${sectionType}.${schoolIdx}.${subjectsFieldName}`) as SubjectRows | undefined;
    
    if (Array.isArray(currentSubjects)) {
      // Remove the subject at rowIdx
      const updatedSubjects = currentSubjects.filter((_, i) => i !== rowIdx);
      
      // Set the updated array directly — avoid unregister which destroys Controller bindings
      form.setValue(
        `${sectionType}.${schoolIdx}.${subjectsFieldName}` as keyof Record<string, unknown>,
        updatedSubjects as never,
        { shouldDirty: true }
      );
      
      // Re-set each field individually so the Controllers pick up the shifted values
      updatedSubjects.forEach((subject, newIdx) => {
        section.repeatables?.fields.forEach((fieldId: string) => {
          const value = subject[fieldId];
          form.setValue(
            `${sectionType}.${schoolIdx}.${subjectsFieldName}.${newIdx}.${fieldId}` as keyof Record<string, unknown>,
            (value ?? '') as never
          );
        });
      });

      // Unregister only the now-extra last slot (the old tail that no longer exists)
      const lastIdx = currentSubjects.length - 1;
      section.repeatables?.fields.forEach((fieldId: string) => {
        form.unregister(
          `${sectionType}.${schoolIdx}.${subjectsFieldName}.${lastIdx}.${fieldId}` as keyof Record<string, unknown>
        );
      });
    }
  };

  const columns = section.columns ?? 1;

  // Watch all form values to reactively show/hide fields based on visibility config
  const formValues = useWatch({ control: form.control });

  return (
    <div>
      {schools.map((school, schoolIdx) => {
        // Check if existing form data has grade information
        // Start from (selectedGrade - 2) and go up in ascending order
        const existingGradeRaw = form.getValues(`${sectionType}.${schoolIdx}.grade`);
        const parsedGrade = typeof existingGradeRaw === 'number' 
          ? existingGradeRaw 
          : typeof existingGradeRaw === 'string' 
            ? parseInt(existingGradeRaw, 10) 
            : undefined;
        // Validate grade is within reasonable range (1-12)
        const existingGrade = parsedGrade && !isNaN(parsedGrade) && parsedGrade >= 1 && parsedGrade <= 12 
          ? parsedGrade 
          : undefined;
        const gradeForSchool = existingGrade ?? (selectedGrade - 2 + schoolIdx);
        const gradeLabel = `${getOrdinalSuffix(gradeForSchool)} Grade`;
        // Show "(Unsaved)" suffix if no existing grade data
        const unsavedSuffix = existingGrade ? '' : ' (Unsaved)';
        
        return (
          <div
            key={school.key}
            className="mb-6 flex flex-col space-y-2 rounded-xl border border-neutral-200 p-4"
          >
            {/* School Heading and Remove Button */}

            <div className="mb-5 flex items-center justify-between">
              <Label size="lg" className="font-semibold text-neutral-900">
                {gradeLabel} Basic Details{unsavedSuffix}
              </Label>
            {schools.length > minSchools && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                label="Remove"
                className="text-blue-500"
                onClick={() => handleRemoveSchool(school.key)}
              />
            )}
          </div>
          {/* Hidden field to store grade information */}
          <input
            type="hidden"
            {...form.register(`${sectionType}.${schoolIdx}.grade`)}
            value={String(gradeForSchool)}
          />
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {section?.fields
              ?.filter(
                (fieldId: string) =>
                  fieldId !== 'redFlags'
              )
              .map((fieldId: string) => {
                const fieldDef = fieldDefs.find((def) => def.id === fieldId);
                if (!fieldDef) return null;
                // Check field-level visibility (e.g., boardOther only when board === 'Others')
                const sectionValues = (formValues as Record<string, unknown>)?.[sectionType];
                const schoolValues = Array.isArray(sectionValues) ? (sectionValues[schoolIdx] as Record<string, unknown>) ?? {} : {};
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
            {gradeLabel} Subject Details{unsavedSuffix}
          </Label>
          <div className="mt-5 overflow-x-auto">
            {(() => {
              // Check if any subject in this school has 'Other' selected
              const hasOtherSubject = school.subjectRows.some((_, rowIdx) => {
                const subjectValue = form.watch(`${section.type}.${schoolIdx}.${section.repeatables?.name}.${rowIdx}.subject`) as string | undefined;
                return subjectValue === 'Other';
              });

              // Filter fields to exclude 'subjectOther' if no 'Other' subject exists
              const visibleFields = section.repeatables?.fields.filter((fieldId: string) => {
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
                    const fieldDef = fieldDefs.find((def) => def.id === fieldId);
                    if (!fieldDef) return null;
                    return (
                      <th
                        key={fieldId}
                        className="px-4 py-3 text-left text-label-md font-semibold text-neutral-900"
                      >
                        {fieldDef.label}
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-right text-label-md font-semibold text-neutral-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {school.subjectRows.map((row, rowIdx) => {
                  // Watch the subject value for this row to conditionally show subjectOther
                  const subjectValue = form.watch(`${section.type}.${schoolIdx}.${section.repeatables?.name}.${rowIdx}.subject`) as string | undefined;
                  const showSubjectOther = subjectValue === 'Other';

                  return (
                  <tr key={(row._id as string) ?? rowIdx} className="border-b border-neutral-200">
                    {visibleFields.map((fieldId: string) => {
                      const fieldDef = fieldDefs.find((def) => def.id === fieldId);
                      if (!fieldDef) return null;
                      
                      // For subjectOther field, only render if this row has 'Other' selected
                      if (fieldId === 'subjectOther' && !showSubjectOther) {
                        return (
                          <td key={fieldId} className="px-4 py-3">
                            <span className="text-neutral-400">-</span>
                          </td>
                        );
                      }
                      
                      const controllerName = `${section.type}.${schoolIdx}.${section.repeatables?.name}.${rowIdx}.${fieldDef.id}`;
                      const repeatableField: FieldDefinition = {
                        ...fieldDef,
                        id: controllerName,
                        label: '', // Remove label in table cells
                      };
                      return (
                        <td key={controllerName} className="px-4 py-3">
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
                        onClick={() => handleRemoveSubjectRow(schoolIdx, rowIdx)}
                        disabled={school.subjectRows.length <= minSubjects}
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
          <button
            type="button"
            className="text-label-sm mt-2 cursor-pointer self-start font-medium text-blue-500"
            onClick={() => handleAddSubjectRow(schoolIdx)}
          >
            {section.repeatables?.repeatable_option?.add ?? '+ Add Subject'}
          </button>
          <hr className="mt-5 mb-10 border-t border-neutral-200" />
          <Label size="lg" className="font-semibold text-neutral-900">
            {gradeLabel} Other Details{unsavedSuffix}
          </Label>
          <div
            className="mt-5 grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {section?.fields
              ?.filter((fieldId: string) =>
                ['redFlags'].includes(fieldId)
              )
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
      {schools.length < 3 && (
        <button
          type="button"
          className="text-label-sm mt-2 cursor-pointer self-start font-medium text-blue-500"
          onClick={() => handleAddSchool()}
        >
          + Add Class
        </button>
      )}
    </div>
  );
};
