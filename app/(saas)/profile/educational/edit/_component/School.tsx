'use client';

import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { Controller, UseFormReturn } from 'react-hook-form';
import Button from '@/app/_components/Button';
import { FieldRenderer } from '@/app/_components/dynamic-form/FieldRenderer';
import { LayoutItem } from '@/app/_components/dynamic-form/types/type';
import { FieldDefinition } from '@/app/utils/dynamicForm';
import { Label } from '@/app/_components/Typography';

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

    return Array.from({ length: initialCount }, (_, idx) => {
      const existingSubjects = Array.isArray(existingSchools) && existingSchools[idx]
        ? (existingSchools[idx] as Record<string, unknown>)[section.repeatables?.name ?? 'subjects']
        : null;
      const subjectsCount = Array.isArray(existingSubjects)
        ? existingSubjects.length
        : minSubjects;

      return {
        key: nanoid(),
        subjectRows: Array.from({ length: subjectsCount }, () =>
          Object.fromEntries(
            (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
          )
        ),
      };
    });
  });

  // Add a new school block with prefilled values from the previous class
  const handleAddSchool = (): void => {
    const lastSchoolIdx = schools.length - 1;
    
    // Get the last class's grade and calculate 1 grade lower
    const lastGrade = form.getValues(`${sectionType}.${lastSchoolIdx}.grade`) as number | undefined;
    const newGrade = lastGrade ? lastGrade - 1 : selectedGrade - schools.length;
    
    // Get values from the last school to prefill
    const lastSchoolName = form.getValues(`${sectionType}.${lastSchoolIdx}.schoolName`) as string | undefined;
    const lastCity = form.getValues(`${sectionType}.${lastSchoolIdx}.city`) as string | undefined;
    const lastYearOfCompletion = form.getValues(`${sectionType}.${lastSchoolIdx}.yearOfCompletion`) as string | undefined;
    
    // Calculate year of completion as 1 year lower
    const newYearOfCompletion = lastYearOfCompletion 
      ? String(parseInt(lastYearOfCompletion, 10) - 1) 
      : '';
    
    // Get subjects from the last school
    const lastSubjects = form.getValues(`${sectionType}.${lastSchoolIdx}.${section.repeatables?.name}`) as SubjectRows | undefined;
    
    // Create new subject rows, prefilling subject names and highest possible score from the previous class
    const newSubjectRows = lastSubjects && Array.isArray(lastSubjects) && lastSubjects.length > 0
      ? lastSubjects.map((subj) => 
          Object.fromEntries(
            (section.repeatables?.fields ?? []).map((fid: string) => [
              fid,
              fid === 'subject' ? (subj.subject ?? '') : 
              fid === 'highestTotalScore' ? (subj.highestTotalScore ?? '') : '',
            ])
          )
        )
      : Array.from({ length: minSubjects }, () =>
          Object.fromEntries(
            (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
          )
        );
    
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
    setSchools((prev) =>
      prev.map((school, idx) =>
        idx === schoolIdx
          ? {
              ...school,
              subjectRows: [
                ...school.subjectRows,
                Object.fromEntries(
                  (section.repeatables?.fields ?? []).map((fid: string) => [
                    fid,
                    '',
                  ])
                ),
              ],
            }
          : school
      )
    );
  };

  // Remove a subject row from a specific school
  const handleRemoveSubjectRow = (schoolIdx: number, rowIdx: number): void => {
    setSchools((prev) =>
      prev.map((school, idx) =>
        idx === schoolIdx
          ? {
              ...school,
              subjectRows: school.subjectRows.filter((_, i) => i !== rowIdx),
            }
          : school
      )
    );
  };

  const columns = section.columns ?? 1;
  return (
    <div>
      {schools.map((school, schoolIdx) => {
        // Check if existing form data has grade information
        const existingGrade = form.getValues(`${sectionType}.${schoolIdx}.grade`) as number | undefined;
        const gradeForSchool = existingGrade ?? (selectedGrade - schoolIdx);
        const gradeLabel = getOrdinalSuffix(gradeForSchool);
        // Show "(Grade Not Specified)" if no existing grade data
        const gradeLabelDisplay = existingGrade 
          ? `${gradeLabel} Grade Basic Details` 
          : `${gradeLabel} Grade Basic Details (Unsaved)`;
        
        return (
          <div
            key={school.key}
            className="mb-6 flex flex-col space-y-2 rounded-xl border border-neutral-200 p-4"
          >
            {/* School Heading and Remove Button */}

            <div className="mb-5 flex items-center justify-between">
              <Label size="lg" className="font-semibold text-neutral-900">
                {gradeLabelDisplay}
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
            value={gradeForSchool}
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
            {gradeLabelDisplay} Grade Subject Details
          </Label>
          <div
            className="mt-5 grid gap-4"
            style={{
              gridTemplateColumns: `${getGridTemplateColumns(section.repeatables?.fields ?? [])} 100px`,
            }}
          >
            {school.subjectRows.map((row, rowIdx) => (
              <React.Fragment key={rowIdx}>
                {section.repeatables?.fields.map((fieldId: string) => {
                  const fieldDef = fieldDefs.find((def) => def.id === fieldId);
                  if (!fieldDef) return null;
                  const controllerName = `${section.type}.${schoolIdx}.${section.repeatables?.name}.${rowIdx}.${fieldDef.id}`;
                  const repeatableField: FieldDefinition = {
                    ...fieldDef,
                    id: controllerName,
                  };
                  return (
                    <div key={controllerName}>
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
                <div className="flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    label="Remove"
                    className="text-blue-500"
                    onClick={() => handleRemoveSubjectRow(schoolIdx, rowIdx)}
                    disabled={school.subjectRows.length <= minSubjects}
                  />
                </div>
              </React.Fragment>
            ))}
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
            {gradeLabelDisplay} Grade Other Details
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
      {schools.length < 2 && (
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
