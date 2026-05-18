'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { Controller, UseFormReturn } from 'react-hook-form';
import Button from '@/app/_components/Button';
import { FieldRenderer } from '@/app/_components/dynamic-form/FieldRenderer';
import { FieldDefinition } from '@/app/utils/dynamicForm';
import { Label } from '@/app/_components/Typography';
import { LayoutItem } from '@/app/_components/dynamic-form/types/type';
import TranscriptUploader from '@/app/_components/TranscriptUploader';

interface TestScoresBlockProps {
  testTypeOptions: string[];
  fieldDefs: FieldDefinition[];
  layout: LayoutItem[];
  form: UseFormReturn<Record<string, unknown>>;
  errors: Record<string, string>;
}

interface TestScoreInstance {
  key: string;
  testType: string;
}

// List of test type layout block types
const TEST_TYPE_LAYOUT_TYPES = [
  'GRE',
  'GMAT',
  'SAT',
  'ACT',
  'AP',
  'TOEFL',
  'IELTS',
  'Executive Assessment',
  'Others',
];

export const TestScoresBlock: React.FC<TestScoresBlockProps> = ({
  testTypeOptions,
  fieldDefs,
  layout,
  form,
  errors,
}) => {
  const minTests = 0;

  // Derive test type fields mapping from layout
  const testTypeFieldsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const item of layout) {
      if (TEST_TYPE_LAYOUT_TYPES.includes(item.type) && item.fields) {
        map[item.type] = item.fields;
      }
    }
    return map;
  }, [layout]);

  // Initialize test scores from existing form data
  const [testScores, setTestScores] = useState<TestScoreInstance[]>(() => {
    const existingScores = form.getValues('testScores') as unknown[];
    if (Array.isArray(existingScores) && existingScores.length > 0) {
      return existingScores
        .filter((score) => {
          // Only include test scores that have a testType
          const testType = (score as Record<string, unknown>)?.testType as string | undefined;
          return testType && testType.length > 0;
        })
        .map((score) => ({
          key: nanoid(),
          testType: (score as Record<string, unknown>)?.testType as string ?? '',
        }));
    }
    return [];
  });

  const watchedAllTestScores = form.watch('testScores');

  // Sync testScores state with form data when form data changes
  useEffect(() => {
    console.log('!!! [TestScoresBlock] watchedAllTestScores:', JSON.stringify(watchedAllTestScores, null, 2));
    console.log('!!! [TestScoresBlock] form.getValues("testScores"):', JSON.stringify(form.getValues('testScores'), null, 2));
    if (Array.isArray(watchedAllTestScores) && watchedAllTestScores.length > 0) {
      const filteredScores = watchedAllTestScores
        .filter((score) => {
          const testType = (score as Record<string, unknown>)?.testType as string | undefined;
          return testType && testType.length > 0;
        })
        .map((score) => ({
          key: nanoid(),
          testType: (score as Record<string, unknown>)?.testType as string ?? '',
        }));

      // Update if the number of test scores changed or if we have no test scores
      if (filteredScores.length !== testScores.length || (testScores.length === 0 && filteredScores.length > 0)) {
        setTestScores(filteredScores);
      }
    } else if (testScores.length > 0) {
      // If form data is empty but we have local state, clear it
      setTestScores([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedAllTestScores)]);

  // Add a new test score
  const handleAddTestScore = (): void => {
    setTestScores((prev) => [
      ...prev,
      {
        key: nanoid(),
        testType: '',
      },
    ]);
  };

  // Remove a test score
  const handleRemoveTestScore = (key: string, testIdx: number): void => {
    // Clear form values for this test
    const testType = testScores.find((t) => t.key === key)?.testType;
    if (testType) {
      const fields = testTypeFieldsMap[testType] ?? [];
      console.log('Clearing fields for removal:', fields);
      fields.forEach((fieldId) => {
        form.setValue(`testScores.${testIdx}.${fieldId}` as keyof Record<string, unknown>, undefined as never);
      });
    }
    form.setValue(`testScores.${testIdx}.testType` as keyof Record<string, unknown>, undefined as never);
    setTestScores((prev) => prev.filter((test) => test.key !== key));
  };

  const columns = 3;

  return (
    <div className="mt-5 flex flex-col gap-6">
      {testScores.length === 0 && (
        <p className="text-para-sm text-neutral-500">
          No test scores added yet. Click the button below to add a test score.
        </p>
      )}

      {testScores.map((test, testIdx) => {
        // Watch the specific testType for this test score to trigger re-render on change
        const watchedTestType = form.watch(`testScores.${testIdx}.testType`) as string | undefined;
        const selectedTestType = watchedTestType ?? test.testType;
        const testFields = selectedTestType ? testTypeFieldsMap[selectedTestType] ?? [] : [];

        return (
          <div
            key={test.key}
            className="flex flex-col space-y-4 rounded-xl border border-neutral-200 p-4"
          >
            {/* Test Score Header */}
            <div className="mb-2 flex items-start justify-between">
              <Label size="lg" className="font-semibold text-neutral-900">
                Test Score {testIdx + 1}
              </Label>
              <div className="flex flex-col items-end gap-2">
                {testScores.length > minTests && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    label="Remove"
                    className="text-blue-500"
                    onClick={() => handleRemoveTestScore(test.key, testIdx)}
                  />
                )}
                <TranscriptUploader targetSection="testScores" targetIndex={testIdx} />
              </div>
            </div>

            {/* Test Type Selection */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <FieldRenderer
                  field={{
                    id: `testScores.${testIdx}.testType`,
                    type: 'select',
                    label: 'Test Type',
                    placeholder: 'Select test type',
                    options: testTypeOptions && testTypeOptions.length > 0 ? testTypeOptions : TEST_TYPE_LAYOUT_TYPES,
                    required: false,
                  }}
                  form={form}
                  error={errors[`testScores.${testIdx}.testType`]}
                  inputHeightClass="py-2"
                  labelHeightClass="text-label-md"
                  inputWidthClass="w-full"
                />
              </div>

              {selectedTestType === 'Other' && (
                <div>
                  <FieldRenderer
                    field={{
                      id: `testScores.${testIdx}.testTypeOther`,
                      type: 'text',
                      label: 'Please specify test type',
                      placeholder: 'Enter test type',
                      required: true,
                    }}
                    form={form}
                    error={errors[`testScores.${testIdx}.testTypeOther`]}
                    inputHeightClass="py-2"
                    labelHeightClass="text-label-md"
                    inputWidthClass="w-full"
                  />
                </div>
              )}
            </div>

            {/* Test-specific Fields */}
            {selectedTestType && testFields.length > 0 && (
              <>
                <hr className="my-4 border-t border-neutral-200" />
                <Label size="md" className="font-semibold text-neutral-900">
                  {selectedTestType} Details
                </Label>
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  }}
                >
                  {testFields.map((fieldId) => {
                    const fieldDef = fieldDefs.find((def) => def.id === fieldId);
                    if (!fieldDef) return null;

                    const controllerName = `testScores.${testIdx}.${fieldDef.id}`;
                    const repeatableField: FieldDefinition = {
                      ...fieldDef,
                      id: controllerName,
                    };

                    // Render title fields differently
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
                        <FieldRenderer
                          field={repeatableField}
                          form={form}
                          error={errors[controllerName]}
                          inputHeightClass="py-2"
                          labelHeightClass="text-label-md"
                          inputWidthClass="w-full"
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Add Test Score Button */}
      <button
        type="button"
        className="text-label-sm cursor-pointer self-start font-medium text-blue-500"
        onClick={handleAddTestScore}
      >
        + Add Test Score
      </button>
    </div>
  );
};
