'use client';

import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { Controller, UseFormReturn } from 'react-hook-form';
import Button from '@/app/_components/Button';
import { FieldRenderer } from '@/app/_components/dynamic-form/FieldRenderer';
import { FieldDefinition } from '@/app/utils/dynamicForm';
import { Label } from '@/app/_components/Typography';

interface TestScoresBlockProps {
  testTypeOptions: string[];
  fieldDefs: FieldDefinition[];
  form: UseFormReturn<Record<string, unknown>>;
  errors: Record<string, string>;
}

interface TestScoreInstance {
  key: string;
  testType: string;
}

// Field configurations for each test type
const TEST_TYPE_FIELDS: Record<string, string[]> = {
  SAT: [
    'testDate',
    'totalScore',
    'writingTitle',
    'writingYourScore',
    'writingYourPercentile',
    'mathTitle',
    'mathYourScore',
    'mathYourPercentile',
    'criticalReadingTitle',
    'criticalReadingYourScore',
    'criticalReadingYourPercentile',
    'retakeExamDate',
  ],
  TOEFL: ['testDate', 'yourScore', 'yourPercentile'],
  IELTS: ['testDate', 'yourScore', 'yourPercentile'],
  GRE: [
    'testDate',
    'totalScore',
    'analyticalWritingTitle',
    'analyticalWritingScore',
    'analyticalWritingPercentile',
    'verbalReasoningTitle',
    'verbalReasoningScore',
    'verbalReasoningPercentile',
    'quantitativeReasoningTitle',
    'quantitativeReasoningScore',
    'quantitativeReasoningPercentile',
    'retakeExamDate',
  ],
  GMAT: [
    'testDate',
    'totalScore',
    'dataInsightsTitle',
    'dataInsightsScore',
    'dataInsightsPercentile',
    'verbalReasoningTitle',
    'verbalReasoningScore',
    'verbalReasoningPercentile',
    'quantitativeReasoningTitle',
    'quantitativeReasoningScore',
    'quantitativeReasoningPercentile',
    'retakeExamDate',
  ],
  Duolingo: ['testDate', 'yourScore', 'yourPercentile'],
  ACT: [
    'testDate',
    'totalScore',
    'englishTitle',
    'englishYourScore',
    'englishYourPercentile',
    'mathTitle',
    'mathYourScore',
    'mathYourPercentile',
    'readingTitle',
    'readingYourScore',
    'readingYourPercentile',
    'scienceTitle',
    'scienceYourScore',
    'scienceYourPercentile',
    'retakeExamDate',
  ],
  'Executive Assessment': [
    'testDate',
    'totalScore',
    'integratedReasoningTitle',
    'integratedReasoningScore',
    'integratedReasoningPercentile',
    'verbalReasoningTitle',
    'verbalReasoningScore',
    'verbalReasoningPercentile',
    'quantitativeReasoningTitle',
    'quantitativeReasoningScore',
    'quantitativeReasoningPercentile',
    'retakeExamDate',
    'tookCoaching',
    'coachingName',
  ],
};

export const TestScoresBlock: React.FC<TestScoresBlockProps> = ({
  testTypeOptions,
  fieldDefs,
  form,
  errors,
}) => {
  const minTests = 0;

  // Initialize test scores from existing form data
  const [testScores, setTestScores] = useState<TestScoreInstance[]>(() => {
    const existingScores = form.getValues('testScores') as unknown[];
    if (Array.isArray(existingScores) && existingScores.length > 0) {
      return existingScores.map((score) => ({
        key: nanoid(),
        testType: (score as Record<string, unknown>)?.testType as string ?? '',
      }));
    }
    return [];
  });

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
      const fields = TEST_TYPE_FIELDS[testType] ?? [];
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
        const testFields = selectedTestType ? TEST_TYPE_FIELDS[selectedTestType] ?? [] : [];

        return (
          <div
            key={test.key}
            className="flex flex-col space-y-4 rounded-xl border border-neutral-200 p-4"
          >
            {/* Test Score Header */}
            <div className="mb-2 flex items-center justify-between">
              <Label size="lg" className="font-semibold text-neutral-900">
                Test Score {testIdx + 1}
              </Label>
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
            </div>

            {/* Test Type Selection */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Controller
                  name={`testScores.${testIdx}.testType` as keyof Record<string, unknown>}
                  control={form.control}
                  render={() => {
                    const testTypeField: FieldDefinition = {
                      id: `testScores.${testIdx}.testType`,
                      type: 'select',
                      label: 'Test Type',
                      placeholder: 'Select test type',
                      options: testTypeOptions,
                      required: true,
                    };
                    return (
                      <FieldRenderer
                        field={testTypeField}
                        form={form}
                        error={errors[`testScores.${testIdx}.testType`]}
                        inputHeightClass="py-2"
                        labelHeightClass="text-label-md"
                        inputWidthClass="w-full"
                      />
                    );
                  }}
                />
              </div>
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
