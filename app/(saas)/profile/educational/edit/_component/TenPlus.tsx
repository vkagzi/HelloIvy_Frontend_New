'use client';

import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { Controller, UseFormReturn } from 'react-hook-form';
import Button from '@/app/_components/Button';
import { FieldRenderer } from '@/app/_components/dynamic-form/FieldRenderer';
import { LayoutItem } from '@/app/_components/dynamic-form/types/type';
import { FieldDefinition } from '@/app/utils/dynamicForm';
interface SchoolBlockProps {
  section: LayoutItem;
  fieldDefs: FieldDefinition[];
  form: UseFormReturn<Record<string, unknown>>;
  errors: Record<string, string>;
  sectionType: string;
}

type SubjectRows = Record<string, unknown>[];

interface SchoolInstance {
  key: string;
  subjectRows: SubjectRows;
}

export const TenPlusBlock: React.FC<SchoolBlockProps> = ({
  section,
  fieldDefs,
  form,
  errors,
  sectionType,
}) => {
  const minSchools = 1;
  const minSubjects = section.repeatables?.repeatable_option?.min ?? 1;

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

  const columns = section.columns ?? 1;
  return (
    <div>
      {schools.map((school, schoolIdx) => (
        <div key={school.key}>
          <div className="mb-5 flex flex-col space-y-2 rounded-xl border border-neutral-200 p-4">
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {school.subjectRows.map((row, rowIdx) => (
                <div key={rowIdx} className="col-span-full">
                  <div className="mb-5 flex items-center justify-between">
                    {schools.length > minSchools && (
                      <>
                        <div className="text-label-md font-bold text-neutral-900">
                          Please explain your level or experience and
                          familiarity in each area
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          label="Remove"
                          className="text-blue-500"
                          onClick={() => handleRemoveSchool(school.key)}
                        />
                      </>
                    )}
                  </div>
                  <div
                    className="grid grid-cols-subgrid gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    }}
                  >
                    {section?.fields?.map((fieldId: string) => {
                      const fieldDef = fieldDefs.find(
                        (def) => def.id === fieldId
                      );

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
                            defaultValue={form.getValues(controllerName) ?? ''}
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
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="text-label-sm mt-2 self-start font-medium text-blue-500"
        onClick={() => handleAddSchool()}
      >
        {'+ Add More'}
      </button>
    </div>
  );
};
