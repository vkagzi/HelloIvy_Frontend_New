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
}

type SubjectRows = Record<string, unknown>[];

interface SchoolInstance {
  key: string;
  subjectRows: SubjectRows;
}

export const GraduateBlock: React.FC<SchoolBlockProps> = ({
  section,
  sectionType,
  fieldDefs,
  form,
  errors,
}) => {
  const minSchools = 1;
  const minSubjects = section.repeatables?.repeatable_option?.min ?? 1;

  //   Array of school blocks, each with a unique key and its own subject rows
  const [schools, setSchools] = useState<SchoolInstance[]>(() =>
    Array.from({ length: minSchools }, () => ({
      key: nanoid(),
      subjectRows: Array.from({ length: minSubjects }, () =>
        Object.fromEntries(
          (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
        )
      ),
    }))
  );

  const handleAddSchool = (): void => {
    setSchools((prev) => [
      ...prev,
      {
        key: nanoid(),
        subjectRows: Array.from({ length: minSubjects }, () =>
          Object.fromEntries(
            (section.repeatables?.fields ?? []).map((fid: string) => [fid, ''])
          )
        ),
      },
    ]);
  };
  //   // Add a new school block
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

  const handleRemoveSchool = (key: string): void => {
    if (schools.length <= minSchools) return;
    setSchools((prev) => prev.filter((school) => school.key !== key));
  };

  const columns = section.columns ?? 1;
  return (
    <div className="flex flex-col gap-7">
      {schools.map((school, schoolIdx) => (
        <div
          key={school.key}
          className="flex flex-col space-y-2 rounded-xl border border-neutral-200 p-4"
        >
          <div className="mb-5 flex items-center justify-between">
            <Label size="lg" className="font-semibold text-neutral-900">
              Year {schoolIdx + 1} Basic Details
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
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {section?.fields
              ?.filter(
                (fieldId: string) => !['redFlags', 'gapYears'].includes(fieldId)
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
          <Label size="lg" className="font-semibold text-neutral-900">
            Year {schoolIdx + 1} Score Details
          </Label>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${(section.repeatables?.fields.length ?? 1) + 1}, minmax(0, 1fr))`,
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
                    disabled={
                      school.subjectRows.length <=
                      (section.repeatables?.repeatable_option?.min ?? 1)
                    }
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
            {section.repeatables?.repeatable_option?.add ?? '+ Add Year'}
          </button>
          <hr
            className="mt-5 mb-10 border-t border-neutral-200"
            aria-hidden="true"
          />
          <Label size="lg" className="font-semibold text-neutral-900">
            Year {schoolIdx + 1} Other Details
          </Label>
          <div
            className="mt-5 grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {section?.fields
              ?.filter((fieldId: string) =>
                ['redFlags', 'gapYears'].includes(fieldId)
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
      ))}
      <button
        type="button"
        className="text-label-sm mt-2 cursor-pointer self-start font-medium text-blue-500"
        onClick={() => handleAddSchool()}
      >
        {'+ Add Degree'}
      </button>
    </div>
  );
};
