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
  repeatable?: boolean;
}

type SubjectRows = Record<string, unknown>[];

interface SchoolInstance {
  key: string;
  subjectRows: SubjectRows;
}

export const TestBlock: React.FC<SchoolBlockProps> = ({
  section,
  sectionType,
  fieldDefs,
  form,
  errors,
  repeatable = true,
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
          <div
            className={`mb-6 flex flex-col ${repeatable ? 'space-y-2 rounded-xl border border-neutral-200 p-4' : ''}`}
          >
            {repeatable && (
              <div className="flex items-center justify-between">
                <Label size="lg" className="font-semibold text-neutral-900">
                  Attempt {schoolIdx + 1} Details
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
            )}
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
                  const controllerName = `${sectionType}.${schoolIdx}.${fieldDef.id}`;
                  const repeatableField: FieldDefinition = {
                    ...fieldDef,
                    id: controllerName,
                  };

                  if (fieldDef.type === 'title') {
                    return (
                      <div key={fieldDef.id} className="col-span-full">
                        <span className="text-label-md block font-semibold text-neutral-900">
                          {fieldDef.label}
                        </span>
                      </div>
                    );
                  }

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
        </div>
      ))}
      {repeatable && (
        <button
          type="button"
          className="text-label-sm mt-2 cursor-pointer self-start font-medium text-blue-500"
          onClick={() => handleAddSchool()}
        >
          + Add Attempt
        </button>
      )}
    </div>
  );
};
