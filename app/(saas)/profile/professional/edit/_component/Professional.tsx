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
}

type SubjectRows = Record<string, unknown>[];

interface SchoolInstance {
  key: string;
  subjectRows: SubjectRows;
}

export const ProfessionalBlock: React.FC<SchoolBlockProps> = ({
  section,
  sectionType,
  fieldDefs,
  form,
  errors,
}) => {
  const minSchools = 1;
  const minSubjects =
    section.repeatables?.repeatable_option?.show_default ??
    section.repeatables?.repeatable_option?.min ??
    1;

  const minAllowed = section.repeatables?.repeatable_option?.min ?? 0;

  // Array of school blocks, each with a unique key and its own subject rows
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

  // Add a new school block
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

  // Use useWatch to subscribe to all form values for dynamic visibility
  const formValues = useWatch({ control: form.control });
  return (
    <div>
      {schools.map((school, schoolIdx) => (
        // <div key={school.key} className="mb-6">
        <div
          key={school.key}
          className="mb-6 flex flex-col space-y-2 rounded-xl border border-neutral-200 p-4"
        >
          {/* Basic Professional Details */}
          <div className="mb-5 flex items-center justify-between">
            <Label size="lg" className="font-semibold text-neutral-900">
              Work Experience {schoolIdx + 1}
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
              ?.filter((fieldId: string) => fieldId !== 'achievements')
              .map((fieldId: string) => {
                const fieldDef = fieldDefs.find((def) => def.id === fieldId);
                if (!fieldDef) return null;
                const sectionValues = Array.isArray(
                  (formValues as Record<string, unknown>)[sectionType]
                )
                  ? ((formValues as Record<string, unknown>)[
                      sectionType
                    ] as Record<string, unknown>[])
                  : [];

                const currentJobValues = sectionValues[schoolIdx] ?? {};
                if (!isFieldVisible(fieldDef, currentJobValues)) return null;
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
          {/* Achievements (Repeatable) */}
          <hr className="border-t border-neutral-200" />
          <h5 className="font-semiBold text-neutral-900">Achievements</h5>
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
                        defaultValue={
                          typeof form.getValues(controllerName) === 'boolean'
                            ? form.getValues(controllerName)
                            : false
                        }
                        // defaultValue={form.getValues(controllerName) ?? ''}
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
                    disabled={school.subjectRows.length <= minAllowed}
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
            {section.repeatables?.repeatable_option?.add ?? '+ Add'}
          </button>
        </div>
      ))}
      {schools.length < 4 && (
        <button
          type="button"
          className="text-label-sm mt-2 cursor-pointer self-start font-medium text-blue-500"
          onClick={() => handleAddSchool()}
        >
          {'+ Add Work Experience'}
        </button>
      )}
    </div>
  );
};
