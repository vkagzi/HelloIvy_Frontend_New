import { FieldDefinition } from '@/app/utils/dynamicForm';
import { FieldType } from '../types/type';

export const getDefaultValue = (type: FieldType): string | number | boolean => {
  switch (type) {
    case 'checkbox':
      return false;
    case 'number':
      return '';
    default:
      return '';
  }
};

export const isFieldVisible = (
  field:
    | FieldDefinition
    | { visibility?: { depends_on: { field_id: string; value: string[] } } },
  formValues: Record<string, unknown>
): boolean => {
  if (!field.visibility?.depends_on) return true;
  const { field_id, value } = field.visibility.depends_on;
  const selected = formValues[field_id];

  if (Array.isArray(selected)) {
    // selected is an array (e.g., multi-select)
    return selected.some((s) => value.includes(s));
  }
  // selected is a single value
  return value.includes(selected as string);
};
