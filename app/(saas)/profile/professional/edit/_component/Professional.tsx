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
import { Checkbox } from '@/app/_components/Checkbox';

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
          <div className="mb-5 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Label size="lg" className="font-semibold text-neutral-900">
                Work Experience/ Internship {schoolIdx + 1} 
              </Label>
              <div className="flex items-center gap-3">
                <Controller
                  name={`${sectionType}.${schoolIdx}.currentlyWorking` as never}
                  control={form.control}
                  defaultValue={false as never}
                  render={({ field: controllerField }) => {
                    const isCurrentlyWorking = controllerField.value === true;
                    return (
                      <label
                        htmlFor={`${sectionType}.${schoolIdx}.currentlyWorking`}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-200 select-none active:scale-97 ${
                          isCurrentlyWorking
                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:border-neutral-300 hover:text-neutral-700'
                        }`}
                      >
                        <Checkbox
                          id={`${sectionType}.${schoolIdx}.currentlyWorking`}
                          checked={isCurrentlyWorking}
                          onCheckedChange={(checked) =>
                            controllerField.onChange(Boolean(checked))
                          }
                        />
                        <span>I currently work here</span>
                      </label>
                    );
                  }}
                />
              </div>
            </div>
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
              ?.filter((fieldId: string) => fieldId !== 'achievements' && fieldId !== 'currentlyWorking')
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
                  <div
                    key={fieldDef.id}
                    style={{
                      gridColumn: fieldDef.width ? `span ${fieldDef.width}` : 'auto'
                    }}
                  >
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
