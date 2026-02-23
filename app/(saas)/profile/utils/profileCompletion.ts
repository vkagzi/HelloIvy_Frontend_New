/**
 * Utility to calculate profile completion percentage
 */

import {
  personalFieldDefs,
  educationalFieldDefs,
  additionalFieldDefs,
  extraCurricularFieldDefs,
} from '@/app/(saas)/profile/_config/fieldDefinitions';
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
 * Calculate completion for personal section
 * Checks 5 main sections:
 * 1. Basic Details (firstName, lastName, dob)
 * 2. Address (addressline, city, country)
 * 3. Family Details (annualIncome)
 * 4. Languages (languages array)
 */
const calculatePersonalCompletion = (
  data: ProfileData,
  _fieldDefs: FieldDefinition[]
): { filled: number; total: number; percentage: number } => {
  const total = 4;
  let filled = 0;

  // 1. Basic Details
  if (isFieldFilled(data.firstName) && isFieldFilled(data.lastName) && isFieldFilled(data.dob)) {
    filled++;
  }

  // 2. Address
  if (isFieldFilled(data.addressline) && isFieldFilled(data.city) && isFieldFilled(data.country)) {
    filled++;
  }

  // 3. Family Details
  if (isFieldFilled(data.annualIncome)) {
    filled++;
  }

  // 4. Languages
  if (Array.isArray(data.languages) && data.languages.length > 0) {
    filled++;
  }

  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

  return { filled, total, percentage };
};

/**
 * Check if a highSchool year entry has meaningful data filled
 * Each entry should have gradeLevel and at least one key field filled
 */
const isHighSchoolYearFilled = (entry: unknown): boolean => {
  if (typeof entry !== 'object' || entry === null) return false;
  const obj = entry as Record<string, unknown>;

  // Must have a gradeLevel identifier
  if (!isFieldFilled(obj.gradeLevel)) return false;

  // Check that at least schoolName or board or a score field is filled
  const keyFields = ['schoolName', 'board', 'typeOfScore', 'yourTotalScore'];
  return keyFields.some((field) => isFieldFilled(obj[field]));
};

/**
 * Check if an undergraduate/postgraduate entry has meaningful data filled
 */
const isDegreeEntryFilled = (entry: unknown): boolean => {
  if (typeof entry !== 'object' || entry === null) return false;
  const obj = entry as Record<string, unknown>;

  const keyFields = ['institutionName', 'degree', 'major'];
  return keyFields.some((field) => isFieldFilled(obj[field]));
};

/**
 * Calculate completion for educational section
 * Checks up to 5 sections (dynamically based on academic level):
 * 1. Academic Details (academicLevel selected)
 * 2. Degree Data (highSchool / undergraduate / postgraduate entries with key fields)
 * 3. Test Scores (testScores array)
 * 4. Courses & Certifications
 * 5. Awards & Scholarships
 */
const calculateEducationalCompletion = (
  data: ProfileData,
  _fieldDefs: FieldDefinition[]
): { filled: number; total: number; percentage: number } => {
  const total = 5;
  let filled = 0;

  // 1. Academic Details - check if academicLevel is filled
  if (isFieldFilled(data.academicLevel)) {
    filled++;
  }

  // 2. Degree data - check relevant section based on academic level
  const academicLevel = data.academicLevel as string | undefined;
  if (academicLevel === 'High School (9th–12th grade)') {
    // Check highSchool array for entries with gradeLevel and meaningful data
    if (
      Array.isArray(data.highSchool) &&
      data.highSchool.length > 0 &&
      data.highSchool.some((entry: unknown) => isHighSchoolYearFilled(entry))
    ) {
      filled++;
    }
  } else if (academicLevel === 'College/Undergraduate') {
    if (
      Array.isArray(data.undergraduate) &&
      data.undergraduate.length > 0 &&
      data.undergraduate.some((entry: unknown) => isDegreeEntryFilled(entry))
    ) {
      filled++;
    }
  } else if (academicLevel === 'Postgraduate') {
    if (
      Array.isArray(data.postgraduate) &&
      data.postgraduate.length > 0 &&
      data.postgraduate.some((entry: unknown) => isDegreeEntryFilled(entry))
    ) {
      filled++;
    }
  } else if (academicLevel === 'Working/Completed College') {
    // tenPlus section
    if (Array.isArray(data.tenPlus) && data.tenPlus.length > 0) {
      filled++;
    }
  }

  // 3. Test Scores
  if (Array.isArray(data.testScores) && data.testScores.length > 0) {
    const hasFilledTest = data.testScores.some((entry: unknown) => {
      if (typeof entry !== 'object' || entry === null) return false;
      return isFieldFilled((entry as Record<string, unknown>).testType);
    });
    if (hasFilledTest) {
      filled++;
    }
  }

  // 4. Courses & Certifications - check if courses array has data
  if (Array.isArray(data.courses) && data.courses.length > 0) {
    filled++;
  }

  // 5. Awards & Scholarships - check if awards array has data
  if (Array.isArray(data.awards) && data.awards.length > 0) {
    filled++;
  }

  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

  return { filled, total, percentage };
};

/**
 * Calculate completion for professional section
 * Checks 2 main sections:
 * 1. Work Experience (experience field)
 * 2. Achievements (achievements array)
 */
const calculateProfessionalCompletion = (
  data: ProfileData,
  _fieldDefs: FieldDefinition[]
): { filled: number; total: number; percentage: number } => {
  const total = 2;
  let filled = 0;

  // 1. Work Experience
  if (isFieldFilled(data.experience)) {
    filled++;
  }

  // 2. Achievements
  if (Array.isArray(data.achievements) && data.achievements.length > 0) {
    filled++;
  }

  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

  return { filled, total, percentage };
};

/**
 * Calculate completion for additional section
 * Checks 2 main sections:
 * 1. Degree Interest
 * 2. Campus Visit / Additional Information
 */
const calculateAdditionalCompletion = (
  data: ProfileData,
  _fieldDefs: FieldDefinition[]
): { filled: number; total: number; percentage: number } => {
  const total = 2;
  let filled = 0;

  // 1. Degree Interest
  if (isFieldFilled(data.degreeInterest)) {
    filled++;
  }

  // 2. Campus Visit or Additional Information
  if (isFieldFilled(data.shareInformation)) {
    filled++;
  }

  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

  return { filled, total, percentage };
};

/**
 * Calculate completion for extra-curricular section
 * Checks if extraCurricular array has data
 */
const calculateExtraCurricularCompletion = (
  data: ProfileData,
  _fieldDefs: FieldDefinition[]
): { filled: number; total: number; percentage: number } => {
  const total = 1;
  let filled = 0;
  // Check if extraCurricular array has data
  if (Array.isArray(data) && data.length > 0) {
    filled++;
  }
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

  return { filled, total, percentage };
};

/**
 * Calculate overall profile completion percentage
 */
export const calculateProfileCompletion = (profileData: {
  personalDetails?: ProfileData;
  educationalDetails?: ProfileData;
  additionalDetails?: ProfileData;
  extraCurricularDetails?: ProfileData;
}): number => {
  let totalFilled = 0;
  let totalFields = 0;

  // Personal details
  const personal = calculatePersonalCompletion(
    profileData.personalDetails ?? {},
    personalFieldDefs
  );
  totalFilled += personal.filled;
  totalFields += personal.total;

  // Educational details (use special handler for nested structure)
  const educational = calculateEducationalCompletion(
    profileData.educationalDetails ?? {},
    educationalFieldDefs
  );
  totalFilled += educational.filled;
  totalFields += educational.total;

  // Additional details
  const additional = calculateAdditionalCompletion(
    profileData.additionalDetails ?? {},
    additionalFieldDefs
  );
  totalFilled += additional.filled;
  totalFields += additional.total;

  // Extra-curricular details
  const extraCurricular = calculateExtraCurricularCompletion(
    profileData.extraCurricularDetails ?? {},
    extraCurricularFieldDefs
  );
  totalFilled += extraCurricular.filled;
  totalFields += extraCurricular.total;

  console.log('Total Filled:', totalFilled, 'Total Fields:', totalFields);
  console.log('Completion Breakdown:', {
    personal,
    educational,
    additional,
    extraCurricular,
  });
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
  additionalDetails?: ProfileData;
  extraCurricularDetails?: ProfileData;
}): {
  personal: number;
  educational: number;
  additional: number;
  extraCurricular: number;
} => {
  const personal = calculatePersonalCompletion(
    profileData.personalDetails ?? {},
    personalFieldDefs
  );
  const educational = calculateEducationalCompletion(
    profileData.educationalDetails ?? {},
    educationalFieldDefs
  );
  const additional = calculateAdditionalCompletion(
    profileData.additionalDetails ?? {},
    additionalFieldDefs
  );

  const extraCurricular = calculateExtraCurricularCompletion(
    profileData.extraCurricularDetails ?? {},
    extraCurricularFieldDefs
  );

  return {
    personal: personal.percentage,
    educational: educational.percentage,
    additional: additional.percentage,
    extraCurricular: extraCurricular.percentage,
  };
};
