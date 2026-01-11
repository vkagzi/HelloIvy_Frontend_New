'use client';

import React from 'react';
import { LayoutItem } from '@/app/_components/dynamic-form/types/type';
import { FieldDefinition } from '@/app/utils/dynamicForm';
import { UseFormReturn } from 'react-hook-form';
import { SchoolBlock } from '@/app/(saas)/profile/educational/edit/_component/School';
import { GraduateBlock } from '@/app/(saas)/profile/educational/edit/_component/Graduate';
import { TenPlusBlock } from '@/app/(saas)/profile/educational/edit/_component/TenPlus';
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
  return (
    <div
      className="mt-4 mb-2 rounded-xl border border-neutral-200"
      key={section.name}
    >
      <h2 className="text-web-h3 p-4 font-semibold text-neutral-900">
        {section.visibility?.depends_on.value}
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
          {(section.type === 'middleSchool' ||
            section.type === 'highSchool') && (
            <SchoolBlock
              section={section}
              sectionType={section.type}
              fieldDefs={fieldDefs}
              form={form}
              errors={errors}
            />
          )}
          {(section.type === 'undergraduate' ||
            section.type === 'postgraduate') && (
            <GraduateBlock
              section={section}
              sectionType={section.type}
              fieldDefs={fieldDefs}
              form={form}
              errors={errors}
            />
          )}
          {section.type === 'tenPlus' && (
            <TenPlusBlock
              section={section}
              fieldDefs={fieldDefs}
              form={form}
              errors={errors}
              sectionType={section.type}
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
            section.type === 'IELTS' ||
            section.type === 'Duolingo') && (
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
