'use client';

import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { Controller, UseFormReturn } from 'react-hook-form';
import Button from '@/app/_components/Button';
import { FieldRenderer } from '@/app/_components/dynamic-form/FieldRenderer';
import { LayoutItem } from '@/app/_components/dynamic-form/types/type';
import { FieldDefinition } from '@/app/utils/dynamicForm';
import { Label } from '@/app/_components/Typography';

interface CourseBlockProps {
  section: LayoutItem;
  sectionType: string;
  fieldDefs: FieldDefinition[];
  form: UseFormReturn<Record<string, unknown>>;
  errors: Record<string, string>;
}

interface CourseInstance {
  key: string;
}

export const CourseBlock: React.FC<CourseBlockProps> = ({
  section,
  sectionType,
  fieldDefs,
  form,
  errors,
}) => {
  const minCourses = section.repeatable_option?.min ?? 0;

  const [courses, setCourses] = useState<CourseInstance[]>(() => {
    // Check if there's existing course data in the form
    const existingCourses = form.getValues(sectionType) as unknown[];
    const existingCount = Array.isArray(existingCourses)
      ? existingCourses.length
      : 0;
    const initialCount = Math.max(minCourses, existingCount);

    return Array.from({ length: initialCount }, () => ({
      key: nanoid(),
    }));
  });

  // Add a new course block
  const handleAddCourse = (): void => {
    setCourses((prev) => [
      ...prev,
      {
        key: nanoid(),
      },
    ]);
  };

  // Remove a course block by key
  const handleRemoveCourse = (key: string): void => {
    if (courses.length <= minCourses) return;
    const courseIdx = courses.findIndex((c) => c.key === key);
    if (courseIdx === -1) return;

    // Remove from form data
    const existingCourses = form.getValues(sectionType) as Record<
      string,
      unknown
    >[];
    if (Array.isArray(existingCourses)) {
      const updatedCourses = existingCourses.filter((_, idx) => idx !== courseIdx);
      form.setValue(sectionType, updatedCourses);
    }

    // Remove from state
    setCourses((prev) => prev.filter((course) => course.key !== key));
  };

  const columns = section.columns ?? 3;
  const formValues = form.watch();

  return (
    <div className="flex flex-col gap-6">
      {courses.map((course, courseIdx) => (
        <div
          key={course.key}
          className="flex flex-col space-y-2 rounded-xl border border-neutral-200 p-4"
        >
          {/* Course Heading and Remove Button */}
          <div className="mb-5 flex items-center justify-between">
            <Label size="lg" className="font-semibold text-neutral-900">
              Course {courseIdx + 1}
            </Label>
            {courses.length > minCourses && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                label="Remove"
                className="text-blue-500"
                onClick={() => handleRemoveCourse(course.key)}
              />
            )}
          </div>

          {/* Course Fields Grid */}
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {section?.fields?.map((fieldId: string) => {
              const fieldDef = fieldDefs.find((def) => def.id === fieldId);
              if (!fieldDef) return null;

              const controllerName = `${sectionType}.${courseIdx}.${fieldDef.id}`;
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

      {/* Add Course Button */}
      <button
        type="button"
        className="text-label-sm cursor-pointer self-start font-medium text-blue-500"
        onClick={() => handleAddCourse()}
      >
        {section.repeatable_option?.add ?? '+ Add Course'}
      </button>
    </div>
  );
};
