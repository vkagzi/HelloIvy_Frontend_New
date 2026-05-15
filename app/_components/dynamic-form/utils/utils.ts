import { FieldDefinition } from '@/app/utils/dynamicForm';
import { FieldType } from '@/app/_components/dynamic-form/types/type';

export const getDefaultValue = (type: FieldType): string | number | boolean | string[] => {
  switch (type) {
    case 'checkbox':
      return false;
    case 'number':
      return '';
    case 'multi_select':
      return [];
    default:
      return '';
  }
};

export const isFieldVisible = (
  field:
    | FieldDefinition
    | { visibility?: { depends_on: { field_id: string; value: (string | boolean | undefined | null)[] } } },
  formValues: Record<string, unknown>
): boolean => {
  if (!field.visibility?.depends_on) return true;
  const { field_id, value } = field.visibility.depends_on;
  const selected = formValues[field_id];

  if (Array.isArray(selected)) {
    // selected is an array (e.g., multi-select)
    return selected.some((s) => value.includes(s as any));
  }
  // selected is a single value
  return value.includes(selected as any);
};
