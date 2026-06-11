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
  field: any,
  formValues: Record<string, unknown>
): boolean => {
  const academicLevel = formValues['academicLevel'] as string | undefined;
  const gradeLevel = formValues['gradeLevel'] as string | undefined;
  const hasCurrentGradeScores = formValues['hasCurrentGradeScores'] as string | undefined;


  // Custom routing logic for educational blocks based on their type
  if (field && typeof field === 'object' && 'type' in field) {
    if (field.type === 'highSchool') {
      if (academicLevel === 'High School (8th–12th grade)') {
        return true;
      }
      if (
        (academicLevel === 'College/Undergraduate' || academicLevel === 'Working/Completed College') &&
        (
          (gradeLevel === 'Year 1' && hasCurrentGradeScores === 'No') ||
          (gradeLevel === 'Year 1' && hasCurrentGradeScores === 'Yes') ||
          (gradeLevel === 'Year 2' && hasCurrentGradeScores === 'No')
        )
      ) {
        return true;
      }
      return false;
    }

    if (field.type === 'undergraduate') {
      if (academicLevel === 'College/Undergraduate') {
        // Fallback to highSchool if Year 1 and No
        if (gradeLevel === 'Year 1' && hasCurrentGradeScores === 'No') {
          return false;
        }
        return true;
      }
      return false;
    }

    if (field.type === 'postgraduate') {
      if (academicLevel === 'Postgraduate') {
        // Fallback to undergraduate_prereq if Year 1 and No
        if (gradeLevel === 'Year 1' && hasCurrentGradeScores === 'No') {
          return false;
        }
        return true;
      }
      return false;
    }

    if (field.type === 'tenPlus') {
      if (academicLevel === 'Working/Completed College') {
        // Fallback to highSchool if Year 1 and No
        if (gradeLevel === 'Year 1' && hasCurrentGradeScores === 'No') {
          return false;
        }
        return true;
      }
      return false;
    }
  }

  // Fallback to standard depends_on logic
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
