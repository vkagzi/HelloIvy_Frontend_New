import { z, ZodType, ZodObject } from 'zod';
import { LayoutItem } from '@/app/_components/dynamic-form/types/type';

export const Regexvalidations = {
  justNumberWithBlank: '^$|^[0-9]+$',
  indiaAndUSZipCode: '^(?:[1-9][0-9]{5}|\\d{5}(?:-\\d{4})?)$',
  percentage: '^(?:[0-9]{1,2}|100)?$',
  percentile: '^([1-9][0-9]?|100)?$',
};

export type FieldValidation = {
  regex?: string;
  regexMessage?: string;
  format?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  required?: boolean;
};

export type ConditionalValidation = {
  fieldId: string;
  values: unknown[]; // values that trigger validation
  validation: FieldValidation;
};

export interface FieldDefinition {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  validation?: FieldValidation;
  visibility?: {
    depends_on: {
      field_id: string;
      value: (string | boolean | undefined | null)[];
    };
  };
  optionsDependsOn?: {
    fieldId: string;
    extractCountry?: boolean;
    map: Record<string, string[]>;
    default?: string[];
  };
  validationDependsOn?: ConditionalValidation[];
  width?: number;
  stateKey?: string;
  countryKey?: string;
  defaultValueFrom?: string;
  minYear?: number;
  maxYear?: number;
}

interface DynamicFormResult {
  schema: ZodType<{ [x: string]: unknown }>;
}

const getFieldSchema = (field: FieldDefinition): ZodType<unknown> => {
  switch (field.type) {
    case 'text':
    case 'textarea': {
      let base: z.ZodString = z.string();
      if (field.required) {
        base = base.min(1, `${field.label} is required`);
      }
      if (field.validation?.maxLength)
        base = base.max(
          field.validation.maxLength,
          `${field.label} must be at most ${field.validation.maxLength} characters`
        );
      if (field.validation?.regex)
        base = base.regex(
          new RegExp(field.validation.regex),
          field.validation.regexMessage ?? `${field.label} format is invalid`
        );
      if (field.validation?.format === 'email')
        base = base.email('Enter a valid email address');
      
      const preprocessed = z.preprocess(
        (val) => (val === null || val === undefined ? val : String(val)),
        base
      );

      if (field.validationDependsOn) {
        return z.preprocess(
          (val) => (val === null || val === undefined ? val : String(val)),
          z.string()
        ).optional();
      }

      if (field.required) {
        return preprocessed;
      }
      return preprocessed.optional().or(z.literal(''));
    }
    case 'url': {
      let base: ZodType<string> = z.string();
      if (field.required) {
        base = z.string().min(1, `${field.label} is required`);
      }
      base = base.refine((val) => {
        if (!val || val.trim() === '') return !field.required;
        const urlPattern = /^https?:\/\/.+\..+/;
        return urlPattern.test(val);
      }, `${field.label} must be a valid URL (e.g., https://example.com)`);

      const preprocessed = z.preprocess(
        (val) => (val === null || val === undefined ? val : String(val)),
        base
      );

      if (field.required) {
        return preprocessed;
      }
      return preprocessed.optional().or(z.literal(''));
    }
    case 'number': {
      let base: ZodType<string> = z.string();
      if (field.required)
        base = z.string().min(1, `${field.label} is required`);
      if (field.validation?.min !== undefined)
        base = base.refine(
          (val) => !val || val.trim() === '' || (!isNaN(Number(val)) && Number(val) >= field.validation!.min!),
          `${field.label} must be at least ${field.validation.min}`
        );
      if (field.validation?.max !== undefined)
        base = base.refine(
          (val) => !val || val.trim() === '' || (!isNaN(Number(val)) && Number(val) <= field.validation!.max!),
          `${field.label} must be at most ${field.validation.max}`
        );

      const preprocessed = z.preprocess(
        (val) => (val === null || val === undefined ? val : String(val)),
        base
      );

      if (field.required) {
        return preprocessed;
      }
      return preprocessed.optional().or(z.literal(''));
    }
    case 'date': {
      let base: ZodType<string> = z.string();
      if (field.required)
        base = z.string().min(1, `${field.label} is required`);
      if (field.validation?.format === 'date')
        base = base.refine(
          (val) => !val || val.trim() === '' || !isNaN(Date.parse(val)),
          `${field.label} must be a valid date`
        );

      const preprocessed = z.preprocess(
        (val) => (val === null || val === undefined ? val : String(val)),
        base
      );

      if (field.required) {
        return preprocessed;
      }
      return preprocessed.optional().or(z.literal(''));
    }
    case 'select':
    case 'radio': {
      let base: ZodType<string> = z.string();
      if (field.required) {
        base = z.string().min(1, `${field.label} is required`);
        base = base.refine((val) => {
          if (!val || val.trim() === '') return false;
          if (val.startsWith('Select ')) return false;
          return true;
        }, `${field.label} is required`);
      }

      const preprocessed = z.preprocess(
        (val) => (val === null || val === undefined ? val : String(val)),
        base
      );

      if (field.required) {
        return preprocessed;
      }
      return preprocessed.optional().or(z.literal(''));
    }
    case 'text_select':
    case 'select_autofill':
    case 'location_autofill':
    case 'month_year': {
      let base: z.ZodString = z.string();
      if (field.required) base = base.min(1, `${field.label} is required`);

      const preprocessed = z.preprocess(
        (val) => (val === null || val === undefined ? val : String(val)),
        base
      );

      if (field.required) {
        return preprocessed;
      }
      return preprocessed.optional().or(z.literal(''));
    }
    case 'checkbox': {
      const checkboxBase = z
        .union([z.boolean(), z.string()])
        .transform((val) => {
          if (typeof val === 'string') {
            return val === 'true' || val === 'on' || val === '1';
          }
          return Boolean(val);
        });
      if (field.required)
        return checkboxBase.refine(
          (val) => val === true,
          `${field.label} must be checked`
        );
      return checkboxBase.optional();
    }
    case 'file': {
      if (field.required)
        return z.unknown().refine((val) => !!val, `${field.label} is required`);
      return z.unknown().optional();
    }
    case 'multi_select': {
      let base = z.array(z.string());
      if (field.required) base = base.min(1, `${field.label} is required`);
      if (field.validation?.max !== undefined) {
        base = base.max(
          field.validation.max,
          `${field.label} must have at most ${field.validation.max} selections`
        );
      }
      if (!field.required) return base.optional();
      return base;
    }
    default:
      return z.string().optional().or(z.literal(''));
  }
};

export const generateDynamicFormSchema = (
  fieldDefs: FieldDefinition[],
  layout: LayoutItem[]
): DynamicFormResult => {
  const shape: Record<string, ZodType<unknown>> = {};

  // Build schema using layout
  layout.forEach((item) => {
    if (item.type === 'fieldset' && item.fields) {
      if (item.repeatable && item.name) {
        // Repeatable fieldset: array of objects
        const objShape: Record<string, ZodType<unknown>> = {};
        item.fields.forEach((fid) => {
          const field = fieldDefs.find((f) => f.id === fid);
          if (field) {
            objShape[fid] = getFieldSchema(field);
          }
        });

        // --- Add conditional validation for fields inside repeatable ---
        let objSchema: ZodType<{ [x: string]: unknown }> = z.object(objShape);
        objSchema = (objSchema as z.ZodObject<any>).refine(
          (data) => {
            const startDate = data.startDate;
            const endDate = data.endDate;

            // Skip if either missing (required validation handles that)
            if (!startDate || !endDate) return true;

            return new Date(startDate) < new Date(endDate);
          },
          {
            message: 'End date must be after Start date',
            path: ['endDate'],
          }
        );
        item.fields.forEach((fid) => {
          const field = fieldDefs.find((f) => f.id === fid);
          if (field?.validationDependsOn) {
            field.validationDependsOn.forEach((cond) => {
              if (cond.validation.required) {
                objSchema = objSchema.refine(
                  (data) =>
                    !cond.values.includes(data[cond.fieldId]) ||
                    (typeof data[fid] === 'string'
                      ? (data[fid] as string).trim().length > 0
                      : false),
                  {
                    message: `${field.label} is required when ${
                      fieldDefs.find((f) => f.id === cond.fieldId)?.label ??
                      cond.fieldId
                    } is ${
                      cond.values.length === 1
                        ? `"${cond.values[0]}"`
                        : `one of: ${cond.values.map((v) => `"${v}"`).join(', ')}`
                    }`,
                    path: [fid],
                  }
                );
              }
            });
          }
        });
        // ---

        let arrSchema = z.array(objSchema);
        shape[item.name] = arrSchema.optional();
      } else {
        // Non-repeatable fieldset: add each field individually
        item.fields.forEach((fid) => {
          const field = fieldDefs.find((f) => f.id === fid);
          if (field) {
            let fieldSchema = getFieldSchema(field);
            // Fields with visibility conditions may be deleted from form data
            // when their condition is not met, so mark them optional in the schema
            if (field.visibility) {
              fieldSchema = fieldSchema.optional();
            }
            shape[fid] = fieldSchema;
          }
        });
      }
    }
  });

  let schema: ZodType<{ [x: string]: unknown }> = z.object(shape);

  // Cross-required logic (at least one of two fields)
  const crossRequiredPairs: Array<[string, string]> = [];
  fieldDefs.forEach((field) => {
    if (field.validationDependsOn) {
      field.validationDependsOn.forEach((cond) => {
        if (
          cond.validation.required &&
          typeof cond.fieldId === 'string' &&
          fieldDefs.some((f) => f.id === cond.fieldId)
        ) {
          crossRequiredPairs.push([field.id, cond.fieldId]);
        }
      });
    }
  });

  crossRequiredPairs.forEach(([idA, idB]) => {
    const fieldA = fieldDefs.find((f) => f.id === idA);
    const fieldB = fieldDefs.find((f) => f.id === idB);

    // Check if the dependency is on blank values
    const isBlankDependency = fieldA?.validationDependsOn?.some(
      (cond) =>
        cond.fieldId === idB &&
        cond.values.every((v) => v === undefined || v === '' || v === null)
    );

    schema = schema.refine(
      (data) => {
        const a = data[idA];
        const b = data[idB];
        const isAEmpty =
          a === undefined || a === null || String(a).trim() === '';
        const isBEmpty =
          b === undefined || b === null || String(b).trim() === '';
        if (isAEmpty && isBEmpty) return true;
        return !isAEmpty || !isBEmpty;
      },
      {
        message: isBlankDependency
          ? `${fieldA?.label ?? idA} is required when ${fieldB?.label ?? idB} is blank`
          : `At least one of ${fieldA?.label ?? idA} or ${fieldB?.label ?? idB} is required`,
        path: [idA],
      }
    );
  });

  // --- Dynamic conditional required logic ---
  fieldDefs.forEach((field) => {
    if (field.validationDependsOn) {
      field.validationDependsOn.forEach((cond) => {
        if (cond.validation.required) {
          // Check if all dependency values are blank
          const isBlankDependency = cond.values.every(
            (v) => v === undefined || v === '' || v === null
          );
          schema = schema.refine(
            (data) =>
              !cond.values.includes(data[cond.fieldId]) ||
              (typeof data[field.id] === 'string'
                ? (data[field.id] as string).trim().length > 0
                : false),
            {
              message: isBlankDependency
                ? `${field.label} is required when ${
                    fieldDefs.find((f) => f.id === cond.fieldId)?.label ??
                    cond.fieldId
                  } is blank`
                : `${field.label} is required when ${
                    fieldDefs.find((f) => f.id === cond.fieldId)?.label ??
                    cond.fieldId
                  } is ${
                    cond.values.length === 1
                      ? `"${cond.values[0]}"`
                      : `one of: ${cond.values.map((v) => `"${v}"`).join(', ')}`
                  }`,
              path: [field.id],
            }
          );
        }
      });
    }
  });
  // --- End dynamic conditional required logic ---

  return {
    schema,
  };
};

export const generateSubSchema = (
  fieldDefs: FieldDefinition[],
  layout: LayoutItem
): DynamicFormResult => {
  const shape: Record<string, ZodType<unknown>> = {};
  if (layout.fields) {
    layout.fields.forEach((fieldId) => {
      const field = fieldDefs.find((f) => f.id === fieldId);
      if (field) {
        shape[fieldId] = getFieldSchema(field);
      }
    });
  }
  if (
    layout.repeatables &&
    layout.repeatables.fields &&
    layout.repeatables.name
  ) {
    const repeatableShape: Record<string, ZodType<unknown>> = {};
    layout.repeatables.fields.forEach((fieldId: string) => {
      const field: FieldDefinition | undefined = fieldDefs.find(
        (f) => f.id === fieldId
      );
      if (field) {
        repeatableShape[fieldId] = getFieldSchema(field);
      }
    });

    // Add conditional validation for fields inside repeatables
    let objSchema: ZodType<{ [x: string]: unknown }> =
      z.object(repeatableShape);
    layout.repeatables.fields.forEach((fid) => {
      const field = fieldDefs.find((f) => f.id === fid);
      if (field?.validationDependsOn) {
        field.validationDependsOn.forEach((cond) => {
          if (cond.validation.required) {
            objSchema = objSchema.refine(
              (data) => {
                // If the dependent field doesn't match the condition, validation passes
                if (!cond.values.includes(data[cond.fieldId])) return true;
                // If the dependent field matches, check that the field has a value
                const value = data[fid];
                return typeof value === 'string' && value.trim().length > 0;
              },
              {
                message: `${field.label} is required when ${
                  fieldDefs.find((f) => f.id === cond.fieldId)?.label ??
                  cond.fieldId
                } is ${
                  cond.values.length === 1
                    ? `"${cond.values[0]}"`
                    : `one of: ${cond.values.map((v) => `"${v}"`).join(', ')}`
                }`,
                path: [fid],
              }
            );
          }
        });
      }
    });

    let arrSchema = z.array(objSchema);
    shape[layout.repeatables.name] = arrSchema.optional();
  }

  // Create the object schema for the layout type
  let layoutObjectSchema: ZodType<{ [x: string]: unknown }> = z.object(shape);

  // Add year range validation for undergraduate/postgraduate sections
  if (layout.type === 'undergraduate' || layout.type === 'postgraduate') {
    layoutObjectSchema = (layoutObjectSchema as ZodObject<any>).refine(
      (data) => {
        const startYear = data.startYear;
        const endYear = data.endYear;

        if (!startYear || !endYear) return true;

        const start = parseInt(String(startYear), 10);
        const end = parseInt(String(endYear), 10);

        const currentYear = new Date().getFullYear();
        const level = layout.type;

        // STUDENTS
        if (level === 'College/Undergraduate') {
          return end >= currentYear && end > start;
        }

        // COMPLETED
        if (level === 'Postgraduate' || level === 'Working/Completed College') {
          return end <= currentYear && end > start;
        }

        return end > start;
      },
      {
        message: 'Invalid End Year based on your academic status',
        path: ['endYear'],
      }
    );
    // endYear must be greater than startYear
    // layoutObjectSchema = (layoutObjectSchema as ZodObject<any>).refine(
    //   (data) => {
    //     const startYear = data.startYear;
    //     const endYear = data.endYear;

    //     // If either is missing, skip validation (required field will catch it)
    //     if (!startYear || !endYear) return true;

    //     const start = parseInt(String(startYear), 10);
    //     const end = parseInt(String(endYear), 10);

    //     return end > start;
    //   },
    //   {
    //     message: 'End Year must be after Start Year',
    //     path: ['endYear'],
    //   }
    // );

    // endYear must not be more than 10 years after startYear
    // layoutObjectSchema = (layoutObjectSchema as ZodObject<any>).refine(
    //   (data) => {
    //     const startYear = data.startYear;
    //     const endYear = data.endYear;

    //     // If either is missing, skip validation (required field will catch it)
    //     if (!startYear || !endYear) return true;

    //     const start = parseInt(String(startYear), 10);
    //     const end = parseInt(String(endYear), 10);

    //     // Check if end year is not more than 10 years after start year
    //     return end <= start + 10;
    //   },
    //   {
    //     message: 'End Year cannot be more than 10 years after Start Year',
    //     path: ['endYear'],
    //   }
    // );
  }

  const schema = z.object({ [layout.type]: z.array(layoutObjectSchema) });
  return {
    schema,
  };
};
