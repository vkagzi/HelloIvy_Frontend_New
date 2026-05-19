'use client';

import React from 'react';
import { LayoutItem } from '@/app/_components/dynamic-form/types/type';
import { FieldDefinition } from '@/app/utils/dynamicForm';
import { UseFormReturn } from 'react-hook-form';
import { SchoolBlock } from '@/app/(saas)/profile/educational/edit/_component/School';
import { GraduateBlock } from '@/app/(saas)/profile/educational/edit/_component/Graduate';

import { TestBlock } from '@/app/(saas)/profile/educational/edit/_component/Test';
import { ProfessionalBlock } from '@/app/(saas)/profile/professional/edit/_component/Professional';

interface ComponentProps {
  section: LayoutItem;
  fieldDefs: FieldDefinition[];
  form: UseFormReturn<Record<string, unknown>>;
  errors: Record<string, string>;
}

const Component: React.FC<ComponentProps> = ({
  section,
  fieldDefs,
  form,
  errors,
}) => {
  // Extract grade number from gradeLevel field (e.g., 'Grade 9' -> 9)
  const gradeLevel = form.watch('gradeLevel');
  const gradeLevelStr = gradeLevel !== undefined && gradeLevel !== null ? String(gradeLevel) : '';
  const parsedGrade = gradeLevelStr
    ? parseInt(gradeLevelStr.replace('Grade ', ''), 10)
    : 9;
  // Ensure selectedGrade is always a valid number, default to 9 if NaN
  const selectedGrade = !isNaN(parsedGrade) ? parsedGrade : 9;
  const hasCurrentGradeScores = form.watch('hasCurrentGradeScores') as string | undefined;

  return (
    <div
      className="mt-4 mb-2 rounded-xl border border-neutral-200"
      key={section.name}
    >
      <h2 className="text-web-h3 p-4 font-semibold text-neutral-900">
        {section.type === 'undergraduate' || section.type === 'undergraduate_prereq'
          ? 'College/Undergraduate' 
          : section.type === 'postgraduate' 
            ? 'Postgraduate'
            : section.type === 'highSchool'
              ? 'High School'
              : section.type === 'tenPlus'
                ? 'Working/Completed College'
                : Array.isArray(section.visibility?.depends_on.value)
                  ? section.visibility?.depends_on.value[0]
                  : section.visibility?.depends_on.value}
      </h2>
      <div>
        <div className="space-y-2 p-4">
          {section.type === 'professional' && (
            <ProfessionalBlock
              section={section}
              sectionType={section.type}
              fieldDefs={fieldDefs}
              form={form}
              errors={errors}
            />
          )}
          {section.type === 'highSchool' && (
            <SchoolBlock
              section={section}
              sectionType={section.type}
              fieldDefs={fieldDefs}
              form={form}
              errors={errors}
              selectedGrade={selectedGrade}
              hasCurrentGradeScores={hasCurrentGradeScores}
            />
          )}
          {(section.type === 'undergraduate' ||
            section.type === 'undergraduate_prereq' ||
            section.type === 'postgraduate' ||
            section.type === 'tenPlus') && (
            <GraduateBlock
              section={section}
              sectionType={section.type}
              fieldDefs={fieldDefs}
              form={form}
              errors={errors}
            />
          )}
          {(section.type === 'SAT' ||
            section.type === 'GRE' ||
            section.type === 'GMAT' ||
            section.type === 'ACT' ||
            section.type === 'Executive Assessment') && (
            <TestBlock
              section={section}
              fieldDefs={fieldDefs}
              form={form}
              errors={errors}
              sectionType={section.type}
            />
          )}
          {(section.type === 'TOEFL' ||
            section.type === 'IELTS') && (
            <TestBlock
              section={section}
              fieldDefs={fieldDefs}
              form={form}
              errors={errors}
              sectionType={section.type}
              repeatable={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Component;
