'use client';

import React, { JSX } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Paragraph, Heading, Label } from '@/app/_components/Typography';
import Sidebar from '@/app/(saas)/profile/_components/Sidebar';
import {
  personalFieldDefs,
  personalLayout,
  professionalFieldDefs,
  professionalLayout,
  additionalFieldDefs,
  additionalLayout,
  educationalFieldDefs,
  educationalLayout,
  extraCurricularFieldDefs,
  getExtraCurricularLayout,
  sectionConfigs,
  type LayoutBlock,
  type SectionConfig,
} from '@/app/(saas)/profile/_config/fieldDefinitions';
import { FieldDefinition } from '@/app/utils/dynamicForm';

type DefaultValues = Record<string, unknown>;

const getSectionFromPath = (pathname: string): string => {
  const parts = pathname.split('/');
  return parts[parts.length - 1] || 'personal';
};

const getDisplayValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === undefined || value === null || value === '') return 'N/A';
  return String(value);
};

const ProfileViewDetails: React.FC<{ defaultValues: DefaultValues }> = ({
  defaultValues,
}) => {
  const pathname = usePathname();
  const section = getSectionFromPath(pathname ?? '');

  // Dynamically generate layout for extra-curricular
  let config = sectionConfigs[section] ?? sectionConfigs['personal'];
  if (section === 'extra-curricular') {
    // Get academicLevel from educational details if available
    const academicLevel =
      typeof defaultValues.educational === 'object' &&
      defaultValues.educational !== null &&
      'academicLevel' in defaultValues.educational
        ? (defaultValues.educational as { academicLevel?: unknown })
            .academicLevel
        : undefined;
    config = {
      fieldDefs: extraCurricularFieldDefs,
      layout: getExtraCurricularLayout(academicLevel as string[] | string),
    };
  }
  const { fieldDefs, layout } = config;

  // Global row index for alternating backgrounds
  let rowIndex = 0;

  // Modified renderFields to accept and increment rowIndex
  const renderFields = (
    fieldDefs: FieldDefinition[],
    fields: string[],
    values: Record<string, unknown>
  ): JSX.Element => {
    // Group fields into pairs for two columns
    const rows = [];
    for (let i = 0; i < fields.length; i += 2) {
      rows.push(fields.slice(i, i + 2));
    }

    return (
      <div>
        {rows.map((pair) => {
          const bgClass = rowIndex % 2 === 0 ? 'bg-white' : 'bg-neutral-50';
          rowIndex++;
          return (
            <div
              key={rowIndex}
              className={`grid grid-cols-1 gap-x-8 gap-y-2 px-3 py-2.5 md:grid-cols-2 ${bgClass}`}
            >
              {pair.map((fid) => {
                const def = fieldDefs.find((f) => f.id === fid);
                if (!def) return null;
                return (
                  <div key={fid} className="flex min-w-0 items-baseline gap-2">
                    <Label size="sm" className="shrink-0 text-neutral-500">
                      {def.label}
                    </Label>
                    <span className="text-neutral-400">:</span>
                    <Paragraph
                      size="xs"
                      className="min-w-0 flex-1 font-medium text-neutral-900"
                    >
                      {getDisplayValue(values[fid])}
                    </Paragraph>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Helper to get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + 'st';
    if (j === 2 && k !== 12) return num + 'nd';
    if (j === 3 && k !== 13) return num + 'rd';
    return num + 'th';
  };

  // Helper to format repeatable section name properly
  const formatRepeatableName = (name: string, item: Record<string, unknown>, idx: number): string => {
    // Special handling for 'years' - show as "1st Year", "2nd Year" etc.
    if (name.toLowerCase() === 'years') {
      const yearValue = item.year;
      const yearNum = typeof yearValue === 'number' ? yearValue : idx + 1;
      return `${getOrdinalSuffix(yearNum)} Year`;
    }
    // Special handling for 'subjects' - show as "Subject 1", "Subject 2" etc.
    if (name.toLowerCase() === 'subjects') {
      return `Subject ${idx + 1}`;
    }
    // Default: capitalize first letter and add index
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    return `${formattedName} ${idx + 1}`;
  };

  // Render year-wise scores as a table
  const renderYearsTable = (
    fieldDefs: FieldDefinition[],
    fields: string[],
    values: Record<string, unknown>[]
  ): JSX.Element => {
    // Get field labels for table headers
    const fieldLabels = fields.map((fid) => {
      const def = fieldDefs.find((f) => f.id === fid);
      return def?.label ?? fid;
    });

    return (
      <div className="mt-3 overflow-x-auto">
        {/* <Label size="md" className="mb-3 block font-semibold text-neutral-800">
          Year Wise Scores
        </Label> */}
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border border-neutral-200 px-4 py-2 text-left">
                <Label size="sm" className="font-semibold text-neutral-700">
                  Year
                </Label>
              </th>
              {fieldLabels.map((label, idx) => (
                <th key={idx} className="border border-neutral-200 px-4 py-2 text-left">
                  <Label size="sm" className="font-semibold text-neutral-700">
                    {label}
                  </Label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.map((item, idx) => {
              const yearValue = item.year;
              const yearNum = typeof yearValue === 'number' ? yearValue : idx + 1;
              const bgClass = idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50';
              return (
                <tr key={idx} className={bgClass}>
                  <td className="border border-neutral-200 px-4 py-2">
                    <Paragraph size="sm" className="font-medium text-blue-600">
                      {getOrdinalSuffix(yearNum)} Year
                    </Paragraph>
                  </td>
                  {fields.map((fid) => (
                    <td key={fid} className="border border-neutral-200 px-4 py-2">
                      <Paragraph size="xs" className="text-neutral-900">
                        {getDisplayValue(item[fid])}
                      </Paragraph>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Render subject-wise scores as a table
  const renderSubjectsTable = (
    fieldDefs: FieldDefinition[],
    fields: string[],
    values: Record<string, unknown>[]
  ): JSX.Element => {
    // Get field labels for table headers
    const fieldLabels = fields.map((fid) => {
      const def = fieldDefs.find((f) => f.id === fid);
      return def?.label ?? fid;
    });

    return (
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-neutral-100">
              {fieldLabels.map((label, idx) => (
                <th key={idx} className="border border-neutral-200 px-4 py-2 text-left">
                  <Label size="sm" className="font-semibold text-neutral-700">
                    {label}
                  </Label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.map((item, idx) => {
              const bgClass = idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50';
              return (
                <tr key={idx} className={bgClass}>
                  {fields.map((fid) => (
                    <td key={fid} className="border border-neutral-200 px-4 py-2">
                      <Paragraph size="xs" className="text-neutral-900">
                        {getDisplayValue(item[fid])}
                      </Paragraph>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Modified renderRepeatable to use the same rowIndex
  const renderRepeatable = (
    fieldDefs: FieldDefinition[],
    name: string,
    fields: string[],
    values: unknown
  ): JSX.Element => {
    if (!Array.isArray(values) || values.length === 0) {
      return (
        <Paragraph size="xs" className="px-2 text-neutral-400 italic">
          No data provided.
        </Paragraph>
      );
    }

    // Special handling for years - render as a table
    if (name.toLowerCase() === 'years') {
      return renderYearsTable(fieldDefs, fields, values as Record<string, unknown>[]);
    }

    // Special handling for subjects - render as a table
    if (name.toLowerCase() === 'subjects') {
      return renderSubjectsTable(fieldDefs, fields, values as Record<string, unknown>[]);
    }

    return (
      <div className="flex flex-col gap-4">
        {(values as Record<string, unknown>[]).map((item, idx) => (
          <div key={idx} className="rounded-md px-2">
            <Paragraph size="sm" className="font-semibold text-blue-600">
              {formatRepeatableName(name, item, idx)}
            </Paragraph>
            {renderFields(fieldDefs, fields, item)}
          </div>
        ))}
      </div>
    );
  };

  const blocks: React.ReactNode[] = [];
  let collapsibleTitle = '';

  layout.forEach((block, idx) => {
    if (block.type === 'collapsible_section_start' && block.content) {
      collapsibleTitle = block.content;
      blocks.push(
        <div className="px-2" key={`collapsible-heading-${idx}`}>
          {idx > 0 && (
            <hr key={`seperator-${idx}`} className="mb-5 border-neutral-300" />
          )}
          <Label size="md" className="font-semibold text-neutral-900">
            {collapsibleTitle}
          </Label>
        </div>
      );
      return;
    }
    if (block.type === 'collapsible_section_end') {
      collapsibleTitle = '';
      return;
    }
    if (block.type === 'heading' && block.content) {
      blocks.push(
        <Label
          key={`label-${idx}`}
          size="md"
          className="px-2 pt-3 font-semibold text-neutral-900"
        >
          {block.content}
        </Label>
      );
      return;
    }
    if (block.type === 'seperator') {
      blocks.push(
        <hr key={`seperator-${idx}`} className="border-neutral-300" />
      );
      return;
    }
    if (block.type === 'fieldset' && block.fields) {
      if (block.repeatable && block.name) {
        blocks.push(
          <div key={`repeatable-${block.name}-${idx}`} className="">
            {renderRepeatable(
              fieldDefs,
              block.name.charAt(0).toUpperCase() + block.name.slice(1),
              block.fields,
              defaultValues[block.name]
            )}
          </div>
        );
      } else {
        blocks.push(
          <div key={`fields-${idx}`} className="">
            {renderFields(fieldDefs, block.fields, defaultValues)}
          </div>
        );
      }
      return;
    }
    if (
      block.fields &&
      typeof block.type === 'string' &&
      block.type !== 'fieldset'
    ) {
      let visible = true;
      if (block.visibility?.depends_on) {
        const { field_id, value } = block.visibility.depends_on;
        const selected = defaultValues[field_id];
        if (Array.isArray(selected)) {
          visible = selected.some((s) => value.includes(s));
        } else {
          visible = value.includes(selected as string);
        }
      }
      if (!visible) return;

      const groupData = defaultValues[block.type];
      if (Array.isArray(groupData)) {
        // Add separator before degree section blocks (highSchool, undergraduate, postgraduate, tenPlus)
        const degreeTypes = ['highSchool', 'undergraduate', 'postgraduate', 'tenPlus'];
        if (degreeTypes.includes(block.type)) {
          blocks.push(
            <hr key={`degree-separator-${block.type}-${idx}`} className="border-neutral-300" />
          );
        }
        
        // For highSchool, add a main "High School" heading first
        if (block.type === 'highSchool') {
          blocks.push(
            <div key={`${block.type}-main-heading`} className="px-3 mb-4">
              <Heading level={5} className="text-blue-700 font-bold">
                High School
              </Heading>
            </div>
          );
        }
        
        groupData.forEach((row, rowIdx) => {
          // Get grade information if it exists (for highSchool)
          const gradeValue = typeof row.grade === 'number' ? row.grade : typeof row.grade === 'string' ? parseInt(row.grade, 10) : null;
          const gradeLabel = gradeValue ? `${getOrdinalSuffix(gradeValue)} Grade` : '';
          
          // For highSchool, show grade as subtitle; for others, show the formatted block type
          const headingText = block.type === 'highSchool' 
            ? (gradeLabel || `Entry ${rowIdx + 1}`)
            : (gradeLabel || `${block.type
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase())}`);
          
          blocks.push(
            <div key={`${block.type}-${rowIdx}`} className="px-3">
              <Heading level={6} className="mb-2 text-blue-700 font-bold">
                {headingText}
              </Heading>
              {renderFields(fieldDefs, block.fields!, row)}
              {block.repeatables &&
                renderRepeatable(
                  fieldDefs,
                  block.repeatables.name,
                  block.repeatables.fields,
                  row[block.repeatables.name]
                )}
            </div>
          );
          
          // Add separator between degrees (not after the last one)
          if (rowIdx < groupData.length - 1) {
            blocks.push(
              <hr key={`degree-item-separator-${block.type}-${rowIdx}`} className="border-neutral-300" />
            );
          }
        });
      }
      return;
    }
  });

  return (
    <div className="flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="flex flex-col px-6">
          <div className="flex items-center justify-end p-1">
            <Link
              href={`/profile/${section}/edit`}
              className="flex items-center gap-2.5"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_25685_12564)">
                  <path
                    d="M13.3309 0.66964C12.9343 0.273671 12.3968 0.0512695 11.8364 0.0512695C11.276 0.0512695 10.7385 0.273671 10.3419 0.66964L0.854592 10.157C0.582905 10.4271 0.367487 10.7485 0.220799 11.1024C0.0741119 11.4564 -0.000932153 11.8359 8.73905e-06 12.2191L8.73905e-06 13.4166C8.73905e-06 13.5714 0.0614669 13.7197 0.170863 13.8291C0.280259 13.9385 0.428632 14 0.583342 14H1.78093C2.16404 14.0011 2.54356 13.9261 2.89752 13.7795C3.25147 13.633 3.57284 13.4176 3.84301 13.146L13.3309 3.65806C13.7267 3.2615 13.949 2.72412 13.949 2.16385C13.949 1.60358 13.7267 1.06619 13.3309 0.66964V0.66964ZM3.01818 12.3211C2.68918 12.648 2.24465 12.832 1.78093 12.8333H1.16668V12.2191C1.16609 11.9892 1.2111 11.7614 1.29911 11.5491C1.38713 11.3367 1.51639 11.1439 1.67943 10.9818L8.87951 3.78172L10.2212 5.12339L3.01818 12.3211ZM12.5055 2.83322L11.0437 4.29564L9.70201 2.95689L11.1644 1.49447C11.2525 1.40657 11.3571 1.33688 11.4721 1.28938C11.5871 1.24188 11.7104 1.2175 11.8348 1.21764C11.9593 1.21777 12.0825 1.24242 12.1974 1.29017C12.3123 1.33792 12.4167 1.40784 12.5046 1.49593C12.5925 1.58403 12.6622 1.68857 12.7097 1.8036C12.7572 1.91863 12.7816 2.04189 12.7815 2.16634C12.7813 2.29079 12.7567 2.41399 12.7089 2.52892C12.6612 2.64384 12.5913 2.74824 12.5032 2.83614L12.5055 2.83322Z"
                    fill="#0055FF"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_25685_12564">
                    <rect width="14" height="14" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              <Label size="md" className="font-medium text-blue-500">
                Edit {section} details
              </Label>
            </Link>
          </div>
          <div className="flex flex-col gap-5 pb-6">{blocks}</div>
        </div>
      </main>
    </div>
  );
};

export default ProfileViewDetails;
