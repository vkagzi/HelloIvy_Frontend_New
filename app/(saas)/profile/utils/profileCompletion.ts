/**
 * Utility to calculate profile completion percentage
 */

import {
  personalFieldDefs,
  educationalFieldDefs,
  professionalFieldDefs,
  additionalFieldDefs,
  extraCurricularFieldDefs,
} from '../_config/fieldDefinitions';
import { FieldDefinition } from '@/app/utils/dynamicForm';

type ProfileData = Record<string, unknown>;

/**
 * Check if a value is considered filled
 */
const isFieldFilled = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  return true;
};

/**
 * Calculate completion percentage for a specific section
 * Only counts required fields or fields that have been filled
 */
const calculateSectionCompletion = (
  data: ProfileData,
  fieldDefs: FieldDefinition[]
): { filled: number; total: number } => {
  let filled = 0;
  let total = 0;

  fieldDefs.forEach((field) => {
    // Skip non-data fields like headings and separators
    if (field.type === 'heading' || field.type === 'seperator' || field.type === 'title') {
      return;
    }

    // Only count fields that are required by default (not conditionally required)
    // Skip fields that are only conditionally required (have validationDependsOn but not required: true)
    const isRequiredByDefault = field.required === true;
    const isConditionallyRequired = field.validationDependsOn && !isRequiredByDefault;
    
    const value = data[field.id];
    const fieldIsFilled = isFieldFilled(value);
    
    // Count this field if it's required OR if it's been filled
    if (isRequiredByDefault || (fieldIsFilled && !isConditionallyRequired)) {
      total++;
      if (fieldIsFilled) {
        filled++;
      }
    }
  });

  return { filled, total };
};

/**
 * Calculate overall profile completion percentage
 */
export const calculateProfileCompletion = (profileData: {
  personalDetails?: ProfileData;
  educationalDetails?: ProfileData;
  professionalDetails?: ProfileData;
  additionalDetails?: ProfileData;
  extraCurricularDetails?: ProfileData;
}): number => {
  let totalFilled = 0;
  let totalFields = 0;

  // Personal details
  const personal = calculateSectionCompletion(
    profileData.personalDetails ?? {},
    personalFieldDefs
  );
  totalFilled += personal.filled;
  totalFields += personal.total;

  // Educational details
  const educational = calculateSectionCompletion(
    profileData.educationalDetails ?? {},
    educationalFieldDefs
  );
  totalFilled += educational.filled;
  totalFields += educational.total;

  // Professional details
  const professional = calculateSectionCompletion(
    profileData.professionalDetails ?? {},
    professionalFieldDefs
  );
  totalFilled += professional.filled;
  totalFields += professional.total;

  // Additional details
  const additional = calculateSectionCompletion(
    profileData.additionalDetails ?? {},
    additionalFieldDefs
  );
  totalFilled += additional.filled;
  totalFields += additional.total;

  // Extra-curricular details (handle array structure)
  const extraCurricular = profileData.extraCurricularDetails ?? {};
  const extraActivities = Array.isArray(extraCurricular.extraCurricular)
    ? extraCurricular.extraCurricular
    : [];

  if (extraActivities.length > 0) {
    extraActivities.forEach((activity: ProfileData) => {
      const activityCompletion = calculateSectionCompletion(
        activity,
        extraCurricularFieldDefs
      );
      totalFilled += activityCompletion.filled;
      totalFields += activityCompletion.total;
    });
  } else {
    // If no activities, count all extra-curricular fields as empty
    totalFields += extraCurricularFieldDefs.filter(
      (f) => f.type !== 'heading' && f.type !== 'seperator'
    ).length;
  }

  // Calculate percentage
  if (totalFields === 0) {
    return 0;
  }

  const percentage = Math.round((totalFilled / totalFields) * 100);
  return percentage;
};

/**
 * Get completion status by section
 */
export const getSectionCompletionDetails = (profileData: {
  personalDetails?: ProfileData;
  educationalDetails?: ProfileData;
  professionalDetails?: ProfileData;
  additionalDetails?: ProfileData;
  extraCurricularDetails?: ProfileData;
}): {
  personal: number;
  educational: number;
  professional: number;
  additional: number;
  extraCurricular: number;
} => {
  const personal = calculateSectionCompletion(
    profileData.personalDetails ?? {},
    personalFieldDefs
  );
  const educational = calculateSectionCompletion(
    profileData.educationalDetails ?? {},
    educationalFieldDefs
  );
  const professional = calculateSectionCompletion(
    profileData.professionalDetails ?? {},
    professionalFieldDefs
  );
  const additional = calculateSectionCompletion(
    profileData.additionalDetails ?? {},
    additionalFieldDefs
  );

  const extraCurricular = profileData.extraCurricularDetails ?? {};
  const extraActivities = Array.isArray(extraCurricular.extraCurricular)
    ? extraCurricular.extraCurricular
    : [];

  let extraFilled = 0;
  let extraTotal = 0;

  if (extraActivities.length > 0) {
    extraActivities.forEach((activity: ProfileData) => {
      const activityCompletion = calculateSectionCompletion(
        activity,
        extraCurricularFieldDefs
      );
      extraFilled += activityCompletion.filled;
      extraTotal += activityCompletion.total;
    });
  } else {
    extraTotal = extraCurricularFieldDefs.filter(
      (f) => f.type !== 'heading' && f.type !== 'seperator'
    ).length;
  }

  return {
    personal: personal.total ? Math.round((personal.filled / personal.total) * 100) : 0,
    educational: educational.total ? Math.round((educational.filled / educational.total) * 100) : 0,
    professional: professional.total ? Math.round((professional.filled / professional.total) * 100) : 0,
    additional: additional.total ? Math.round((additional.filled / additional.total) * 100) : 0,
    extraCurricular: extraTotal ? Math.round((extraFilled / extraTotal) * 100) : 0,
  };
};
