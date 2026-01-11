'use client';

import React, { useEffect, useState } from 'react';
import type { FieldDefinition } from '@/app/utils/dynamicForm';
import {
  generateDynamicFormSchema,
  generateSubSchema,
} from '@/app/utils/dynamicForm';
import { useForm, Controller, UseFormReturn } from 'react-hook-form';
import { FieldRenderer } from '@/app/_components/dynamic-form/FieldRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { FieldType, LayoutItem } from '@/app/_components/dynamic-form/types/type';
import CollapsibleSection from '@/app/_components/CollapsibleSection';
import Component from '@/app/(saas)/profile/educational/edit/_component/Component';
import { getDefaultValue, isFieldVisible } from '@/app/_components/dynamic-form/utils/utils';
import { Heading, Label } from '@/app/_components/Typography';
import Image from 'next/image';
import bin from '@/assets/images/bin.svg';
import Link from 'next/link';

type DynamicFormProps = {
  fieldDefs: FieldDefinition[];
  layout: LayoutItem[];
  onSubmit: (values: Record<string, unknown>) => void;
  formClassName?: string;
  buttonName: string;
  defaultValues?: Record<string, unknown>;
  onFormInit?: (form: UseFormReturn<Record<string, unknown>>) => void;
  showSaveButton?: { showSave: boolean; href?: string };
};

// Utility to flatten repeatable fields for React Hook Form
const flattenDefaultValues = (
  values: Record<string, unknown>,
  layout: LayoutItem[]
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...values };
  layout.forEach((item) => {
    if (item.repeatable && item.name && Array.isArray(values[item.name])) {
      const arr = values[item.name] as Record<string, unknown>[];
      arr.forEach((row, idx) => {
        Object.entries(row).forEach(([key, val]) => {
          result[`${item.name}.${idx}.${key}`] = val;
        });
      });
      // Optionally, keep the array for form.getValues
      result[item.name] = arr;
    }
  });
  return result;
};

const DynamicForm: React.FC<DynamicFormProps> = ({
  fieldDefs,
  layout,
  onSubmit,
  formClassName,
  buttonName,
  defaultValues,
  onFormInit,
  showSaveButton = { showSave: false },
}) => {
  const initialState: Record<string, unknown> = {};
  layout.forEach((item) => {
    if (item.type === 'fieldset' && item.fields) {
      if (item.repeatable && item.name) {
        // Use show_default as a number for default rows, fallback to min or 1
        const showDefaultRows =
          typeof item.repeatable_option?.show_default === 'number'
            ? item.repeatable_option.show_default
            : item.repeatable_option?.show_default
              ? 1
              : (item.repeatable_option?.min ?? 1);

        initialState[item.name] = Array.from({ length: showDefaultRows }).map(
          () =>
            Object.fromEntries(
              (item.fields ?? []).map((fid) => {
                const field = fieldDefs.find((f) => f.id === fid);
                return [
                  fid,
                  field ? getDefaultValue(field.type as FieldType) : '',
                ];
              })
            )
        );
      } else {
        item.fields.forEach((fid) => {
          const field = fieldDefs.find((f) => f.id === fid);
          if (field) {
            initialState[fid] = getDefaultValue(field.type as FieldType);
          }
        });
      }
    }
  });

  // Flatten defaultValues for repeatable fields
  const flatDefaultValues =
    defaultValues && Object.keys(defaultValues).length > 0
      ? flattenDefaultValues(defaultValues, layout)
      : initialState;

  const form = useForm<Record<string, unknown>>({
    defaultValues: flatDefaultValues,
    mode: 'onChange',
  });

  React.useEffect(() => {
    if (onFormInit) {
      onFormInit(form);
    }
  }, [onFormInit, form]);

  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      form.reset(flattenDefaultValues(defaultValues, layout));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues]);

  const formValues = form.watch();
  // const [instances, setInstances] = useState<number>(1);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Clear errors when field values change
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name && errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, errors]);

  // Generate Zod schema
  let { schema } = generateDynamicFormSchema(fieldDefs, layout);

  const handleAddRepeatable = (groupName: string, fields: string[]): void => {
    const arrUnknown: unknown = form.getValues(groupName);
    const arr: Record<string, unknown>[] = Array.isArray(arrUnknown)
      ? (arrUnknown as Record<string, unknown>[])
      : [];
    arr.push(
      Object.fromEntries(
        fields.map((fid) => {
          const field = fieldDefs.find((f) => f.id === fid);
          return [fid, field ? getDefaultValue(field.type as FieldType) : ''];
        })
      )
    );
    form.setValue(groupName, arr);
  };

  const handleRemoveRepeatable = (groupName: string, idx: number): void => {
    const arr = form.getValues(groupName);
    if (Array.isArray(arr)) {
      arr.splice(idx, 1);
      form.setValue(groupName, arr);
    }
  };

  // Render heading
  const renderHeading = (
    item: LayoutItem,
    idx: number,
    formValues?: Record<string, unknown>
  ): React.ReactNode => {
    if (formValues && !isFieldVisible(item, formValues)) return null;
    return (
      <div className="mb-5" key={idx}>
        <Label size="lg" className="font-semibold text-neutral-900">
          {item.content}
        </Label>
      </div>
    );
  };

  // Render separator
  const renderSeparator = (idx: number): React.ReactNode => (
    <hr
      key={idx}
      className="my-10 border-t border-neutral-200"
      aria-hidden="true"
    />
  );

  // Map columns to Tailwind classes
  const getGridColsClass = (cols: number): string => {
    const colsMap: Record<number, string> = {
      1: 'md:grid-cols-1',
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
      5: 'md:grid-cols-5',
      6: 'md:grid-cols-6',
    };
    return colsMap[cols] || 'md:grid-cols-3';
  };

  // Get field width class based on width property
  const getFieldWidthClass = (field: FieldDefinition): string => {
    if (!field.width) return '';
    // Use col-span for grid layouts
    const width = field.width;
    if (width === 1.5) return 'md:col-span-2';
    if (width === 2) return 'md:col-span-2';
    if (width === 3) return 'md:col-span-3';
    return '';
  };

  // Update renderRepeatableFieldset to always show remove button for repeatable fieldsets
  const renderRepeatableFieldset = (item: LayoutItem): React.ReactNode => {
    if (item.repeatable && item.name) {
      const getRepeatableOption = (
        item: LayoutItem,
        formValues: Record<string, unknown>
      ): { show_default: number; min: number; columns?: number } => {
        let option = { ...item.repeatable_option };
        if (
          item.repeatableDependsOn &&
          Array.isArray(item.repeatableDependsOn)
        ) {
          for (const dep of item.repeatableDependsOn) {
            const currentValue = formValues[dep.fieldId];
            if (dep.values.includes(currentValue as string)) {
              option = { ...option, ...dep.option };
            }
          }
        }
        return option as {
          show_default: number;
          min: number;
          columns?: number;
        };
      };

      const repeatableOption = getRepeatableOption(item, form.watch());
      const minRows = repeatableOption.min ?? 0;
      const repeatArr = form.watch(item.name) as Record<string, unknown>[];

      const disableRemove = (repeatArr?.length ?? 0) <= minRows;
      const repeatableColumns = repeatableOption.columns ?? item.columns ?? 3;

      return (
        <div key={item.name} className="mt-5 flex flex-col gap-4">
          <div className={`grid gap-4 ${getGridColsClass(item.columns ?? 1)}`}>
            {(repeatArr ?? []).map((row, rIdx) => (
              <div key={rIdx} className="flex items-end gap-2">
                <div className={`grid flex-1 items-end gap-4 ${getGridColsClass(repeatableColumns)}`}>
                  {item.fields?.map((fid) => {
                    const field = fieldDefs.find((f) => f.id === fid);
                    if (!field || !isFieldVisible(field, formValues)) return null;
                    const errorKey = `${item.name}.${rIdx}.${fid}`;
                    const repeatableField: FieldDefinition = {
                      ...field,
                      id: `${item.name}.${rIdx}.${fid}`,
                    };
                    const widthClass = getFieldWidthClass(field);
                    return (
                      <div key={`${item.name}.${rIdx}.${fid}`} className={widthClass}>
                        <Controller
                          name={`${item.name}.${rIdx}.${fid}` as never}
                          control={form.control}
                          defaultValue={
                            (form.getValues(`${item.name}.${rIdx}.${fid}`) ??
                              '') as never
                          }
                          render={() => (
                            <FieldRenderer
                              field={repeatableField}
                              form={form}
                              error={errors[errorKey]}
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
                {!disableRemove && (
                  <button
                    type="button"
                    className="text-label-sm mb-0.5 cursor-pointer font-medium text-red-500 transition-colors hover:text-red-700"
                    onClick={() => handleRemoveRepeatable(item.name!, rIdx)}
                    disabled={disableRemove}
                    aria-label="Remove"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-label-sm cursor-pointer self-start font-medium text-blue-500"
            onClick={() => handleAddRepeatable(item.name!, item.fields ?? [])}
            disabled={
              item.repeatable_option?.max !== undefined &&
              (repeatArr?.length ?? 0) >= item.repeatable_option.max
            }
          >
            {item.repeatable_option?.add ?? '+ Add'}
          </button>
        </div>
      );
    }
    // Non-repeatable fieldset
    return (
      <div
        key={item.fields && item.fields.join('-')}
        className={`grid gap-4 ${getGridColsClass(item.columns ?? 1)}`}
      >
        {item.fields &&
          item.fields.map((fid) => {
            const field = fieldDefs.find((f) => f.id === fid);
            if (!field) return null;
            const widthClass = getFieldWidthClass(field);
            return (
              <div key={fid} className={widthClass}>
                <Controller
                  name={fid}
                  control={form.control}
                  defaultValue={form.getValues(fid) ?? ''}
                  render={() => (
                    <FieldRenderer
                      field={field}
                      form={form}
                      error={errors[fid]}
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
    );
  };

  // --- rest of your DynamicForm code unchanged ---

  const renderFieldset = (
    item: LayoutItem,
    formValues: Record<string, unknown>
  ): React.ReactNode => {
    return (
      <div
        key={item.fields && item.fields.join('-')}
        className={`grid gap-4 ${getGridColsClass(item.columns ?? 1)} mt-4`}
      >
        {item.fields &&
          item.fields.map((fid) => {
            const field = fieldDefs.find((f) => f.id === fid);
            if (!field || !isFieldVisible(field, formValues)) return null;
            const widthClass = getFieldWidthClass(field);
            return (
              <div key={fid} className={widthClass}>
                <Controller
                  name={fid}
                  control={form.control}
                  defaultValue={form.getValues(fid) ?? ''}
                  render={() => (
                    <FieldRenderer
                      field={field}
                      form={form}
                      error={errors[fid]}
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
    );
  };

  const renderedSections: React.ReactNode[] = [];
  let i = 0;
  while (i < layout.length) {
    const item = layout[i];
    if (!isFieldVisible(item, formValues)) {
      i++;
      continue;
    }
    if (item.type === 'collapsible_section_start') {
      const sectionTitle = item.content ?? '';
      const sectionContent: React.ReactNode[] = [];
      i++;
      while (
        i < layout.length &&
        layout[i].type !== 'collapsible_section_end'
      ) {
        const innerItem = layout[i];
        if (!isFieldVisible(innerItem, formValues)) {
          i++;
          continue;
        }
        // --- ADD THIS ---
        if (innerItem.type === 'section_rounded_start') {
          const roundedTitle = innerItem.content ?? '';
          const roundedContent: React.ReactNode[] = [];
          i++;
          while (
            i < layout.length &&
            layout[i].type !== 'section_rounded_end'
          ) {
            const roundedInner = layout[i];
            if (!isFieldVisible(roundedInner, formValues)) {
              i++;
              continue;
            }
            if (roundedInner.type === 'heading' && roundedInner.content) {
              roundedContent.push(renderHeading(roundedInner, i, formValues));
            } else if (
              roundedInner.type === 'fieldset' &&
              roundedInner.fields
            ) {
              if (roundedInner.repeatable && roundedInner.name) {
                roundedContent.push(renderRepeatableFieldset(roundedInner));
              } else {
                roundedContent.push(renderFieldset(roundedInner, formValues));
              }
            }
            // ...handle other types as needed...
            i++;
          }
          sectionContent.push(
            <SectionRounded key={roundedTitle} title={roundedTitle}>
              {roundedContent}
            </SectionRounded>
          );
          i++; // skip section_rounded_end
          continue;
        }
        // // --- END ADD ---
        if (innerItem.type === 'heading' && innerItem.content) {
          sectionContent.push(renderHeading(innerItem, i, formValues));
        } else if (innerItem.type === 'seperator') {
          sectionContent.push(renderSeparator(i));
        } else if (innerItem.type === 'fieldset' && innerItem.fields) {
          if (innerItem.repeatable && innerItem.name) {
            sectionContent.push(renderRepeatableFieldset(innerItem));
          } else {
            sectionContent.push(renderFieldset(innerItem, formValues));
          }
        } else if (
          innerItem.type === 'middleSchool' ||
          innerItem.type === 'highSchool' ||
          innerItem.type === 'undergraduate' ||
          innerItem.type === 'postgraduate' ||
          innerItem.type === 'tenPlus' ||
          innerItem.type === 'professional' ||
          innerItem.type === 'SAT' ||
          innerItem.type === 'TOEFL' ||
          innerItem.type === 'IELTS' ||
          innerItem.type === 'GRE' ||
          innerItem.type === 'GMAT' ||
          innerItem.type === 'Duolingo' ||
          innerItem.type === 'ACT' ||
          innerItem.type === 'Executive Assessment'
        ) {
          const subSchema = generateSubSchema(fieldDefs, innerItem).schema;
          // Combine schemas by extracting shape and creating new object
          schema = schema.and(subSchema);
          sectionContent.push(
            <Component
              key={`edu-${innerItem.type}-${i}`}
              section={innerItem}
              fieldDefs={fieldDefs}
              form={form}
              errors={errors}
            />
          );
        }
        i++;
      }
      renderedSections.push(
        <CollapsibleSection key={sectionTitle} title={sectionTitle}>
          {sectionContent}
        </CollapsibleSection>
      );
      i++; // Skip collapsible_section_end
    }
    // // --- Section Rounded ---
    else if (item.type === 'section_rounded_start') {
      const sectionTitle = item.content ?? '';
      const sectionContent: React.ReactNode[] = [];
      i++;
      while (i < layout.length && layout[i].type !== 'section_rounded_end') {
        const innerItem = layout[i];
        if (!isFieldVisible(innerItem, formValues)) {
          i++;
          continue;
        }
        // Render all children (heading, fieldset, etc.) inside the section
        if (innerItem.type === 'heading' && innerItem.content) {
          sectionContent.push(renderHeading(innerItem, i, formValues));
        } else if (innerItem.type === 'seperator') {
          sectionContent.push(renderSeparator(i));
        } else if (innerItem.type === 'fieldset' && innerItem.fields) {
          if (innerItem.repeatable && innerItem.name) {
            sectionContent.push(renderRepeatableFieldset(innerItem));
          } else {
            sectionContent.push(renderFieldset(innerItem, formValues));
          }
        }
        // ...handle other types as needed...
        i++;
      }
      renderedSections.push(
        <SectionRounded key={sectionTitle} title={sectionTitle}>
          {sectionContent}
        </SectionRounded>
      );
      i++; // Skip section_rounded_end
    }
    // // --- Other layout types ---
    else if (item.type === 'heading' && item.content) {
      renderedSections.push(renderHeading(item, i, formValues));
      i++;
    } else if (item.type === 'seperator') {
      renderedSections.push(renderSeparator(i));
      i++;
    } else if (item.type === 'fieldset' && item.fields) {
      if (item.repeatable && item.name) {
        renderedSections.push(renderRepeatableFieldset(item));
      } else {
        renderedSections.push(renderFieldset(item, formValues));
      }
      i++;
    } else {
      i++;
    }
  }

  // --- Add this effect to auto-adjust repeatable rows ---
  useEffect(() => {
    layout.forEach((item) => {
      if (item.repeatable && item.name) {
        const repeatableOption = (() => {
          let option = { ...item.repeatable_option };
          if (
            item.repeatableDependsOn &&
            Array.isArray(item.repeatableDependsOn)
          ) {
            for (const dep of item.repeatableDependsOn) {
              const currentValue = form.watch(dep.fieldId);
              if (dep.values.includes(currentValue as string)) {
                option = { ...option, ...dep.option };
              }
            }
          }
          return option as { show_default: number; min: number };
        })();

        const showDefaultRows =
          repeatableOption.show_default ?? repeatableOption.min ?? 0;
        const arr = form.getValues(item.name) as unknown[];
        if (!Array.isArray(arr) || arr.length < showDefaultRows) {
          // Add rows if needed
          const fields = item.fields ?? [];
          const toAdd = showDefaultRows - (Array.isArray(arr) ? arr.length : 0);
          if (toAdd > 0) {
            const newArr = [
              ...(Array.isArray(arr) ? arr : []),
              ...Array.from({ length: toAdd }).map(() =>
                Object.fromEntries(
                  fields.map((fid) => {
                    const field = fieldDefs.find((f) => f.id === fid);
                    return [
                      fid,
                      field ? getDefaultValue(field.type as FieldType) : '',
                    ];
                  })
                )
              ),
            ];
            form.setValue(item.name, newArr);
          }
        }
        // Optionally, trim rows if too many (not required for min/show_default)
      }
    });
    // Only run when dependencies change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, layout, form.watch('maintainChannel')]);
  // Add other dependencies if you have more repeatableDependsOn fields

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        const result = schema.safeParse(values);
        console.log('Form values:', values);
        console.log('Validation result:', result);
        if (!result.success) {
          console.error('Form validation errors:', result.error.issues);
          const fieldErrors: Record<string, string> = {};
          result.error.issues.forEach((err) => {
            const errorKey = err.path.map((p) => String(p)).join('.');
            fieldErrors[errorKey] = err.message;
          });
          setErrors(fieldErrors);
          return;
        }
        setErrors({});
        onSubmit(values);
      })}
      noValidate
      autoComplete="off"
    >
      <Card className="border-neutral-200 shadow-sm">
        <CardContent className={`pt-6 ${formClassName}`}>
          {renderedSections}
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t border-neutral-100 pt-6">
          {showSaveButton.showSave ? (
            <>
              <Button
                variant="outline"
                size="lg"
                type="submit"
                className="min-w-[120px]"
              >
                Save
              </Button>
              <Button
                variant="default"
                size="lg"
                asChild
                className="min-w-[140px]"
              >
                <Link href={showSaveButton.href || '#'}>
                  {buttonName}
                </Link>
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="lg"
              type="submit"
              className="min-w-[140px]"
            >
              {buttonName}
            </Button>
          )}
        </CardFooter>
      </Card>
    </form>
  );
};

const SectionRounded: React.FC<{
  title?: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
    {title && (
      <Heading
        level={3}
        className="text-web-h3 mb-4 text-left font-semibold text-neutral-900"
      >
        {title}
      </Heading>
    )}
    {children}
  </div>
);

export default DynamicForm;
