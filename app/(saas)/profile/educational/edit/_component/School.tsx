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

export const SchoolBlock: React.FC<SchoolBlockProps> = ({
  section,
  sectionType,
  fieldDefs,
  form,
  errors,
}) => {
  const minSchools = 1;
  const minSubjects = section.repeatables?.repeatable_option?.min ?? 1;

  // Helper to calculate grid template columns with field widths
  const getGridTemplateColumns = (fieldIds: string[]): string => {
    const widths = fieldIds.map((fid) => {
      const field = fieldDefs.find((f) => f.id === fid);
      return field?.width ?? 1;
    });
    return widths.map((w) => `${w}fr`).join(' ');
  };

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
  return (
    <div>
      {schools.map((school, schoolIdx) => (
        <div
          key={school.key}
          className="mb-6 flex flex-col space-y-2 rounded-xl border border-neutral-200 p-4"
        >
          {/* School Heading and Remove Button */}

          <div className="mb-5 flex items-center justify-between">
            <Label size="lg" className="font-semibold text-neutral-900">
              {schoolIdx + (sectionType === 'middleSchool' ? 5 : 9)}th Class
              Basic Details
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
                (fieldId: string) =>
                  fieldId !== 'redFlags' && fieldId !== 'gapYears'
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
            {schoolIdx + (sectionType === 'middleSchool' ? 5 : 9)}th Class
            Subject Details
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
            {schoolIdx + (sectionType === 'middleSchool' ? 5 : 9)}th Class Other
            Details
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
      {schools.length < 4 && (
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
