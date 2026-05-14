/**
 * Utility to calculate profile completion percentage.
 *
 * IMPORTANT: This logic MUST stay in sync with the backend calculation in
 * helloivy-api-main/apps/profiles/services.py → calculate_profile_completion().
 *
 * Tracked sections (3):
 *   1. personalDetails  – 9 required fields checked individually
 *   2. educational       – 1 required field  (academicLevel)
 *   3. extraCurricular   – non-empty array   (1 point)
 *
 * Total required items = 11.  Percentage = Math.round(filled / 11 * 100).
 */

type ProfileData = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Required fields – must match the backend _PERSONAL_REQUIRED_FIELDS and
// _EDUCATIONAL_REQUIRED_FIELDS lists exactly.
// ---------------------------------------------------------------------------
const PERSONAL_REQUIRED_FIELDS = [
  'dob', 'countryCode', 'phoneNumber',
  'gender', 'addressline', 'city', 'zipcode', 'citizenShip', 'annualIncome',
] as const;

const EDUCATIONAL_REQUIRED_FIELDS = ['academicLevel'] as const;

/**
 * Check if a single value is considered filled (mirrors backend _is_value_filled).
 */
const isFieldFilled = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return true;
};

// ---------------------------------------------------------------------------
// Per-section helpers
// ---------------------------------------------------------------------------

const countFilledFields = (
  data: ProfileData,
  fields: readonly string[],
): { filled: number; total: number; allFilled: boolean } => {
  let filled = 0;
  for (const field of fields) {
    if (isFieldFilled(data[field])) filled++;
  }
  return { filled, total: fields.length, allFilled: filled === fields.length };
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate overall profile completion percentage.
 * Each of the 4 sections contributes exactly 25%.
 * - Personal Details: 25%
 * - Educational: 25%
 * - Professional (experiences): 25%
 * - Extra-curricular (extraCurricular): 25%
 */
export const calculateProfileCompletion = (profileData: {
  personalDetails?: ProfileData;
  educationalDetails?: ProfileData;
  professionalDetails?: ProfileData;
  extraCurricularDetails?: unknown;
}): number => {
  let totalPercentage = 0;

  // 1. Personal details (25%)
  const personal = countFilledFields(
    profileData.personalDetails ?? {},
    PERSONAL_REQUIRED_FIELDS,
  );
  if (personal.total > 0) {
    totalPercentage += (personal.filled / personal.total) * 25;
  }

  // 2. Educational (25%)
  const educational = countFilledFields(
    profileData.educationalDetails ?? {},
    EDUCATIONAL_REQUIRED_FIELDS,
  );
  if (educational.total > 0) {
    totalPercentage += (educational.filled / educational.total) * 25;
  }

  // 3. Professional (25%)
  const profData = profileData.professionalDetails?.experiences;
  if (Array.isArray(profData) && profData.length > 0) {
    totalPercentage += 25;
  }

  // 4. Extra-curricular (25%)
  const ecData = profileData.extraCurricularDetails;
  if (Array.isArray(ecData) && ecData.length > 0) {
    totalPercentage += 25;
  }

  return Math.round(Math.min(totalPercentage, 100));
};

/**
 * Get completion status broken down by section.
 */
export const getSectionCompletionDetails = (profileData: {
  personalDetails?: ProfileData;
  educationalDetails?: ProfileData;
  professionalDetails?: ProfileData;
  extraCurricularDetails?: unknown;
}): {
  personal: number;
  educational: number;
  professional: number;
  extraCurricular: number;
} => {
  const personal = countFilledFields(
    profileData.personalDetails ?? {},
    PERSONAL_REQUIRED_FIELDS,
  );
  const educational = countFilledFields(
    profileData.educationalDetails ?? {},
    EDUCATIONAL_REQUIRED_FIELDS,
  );

  const profData = profileData.professionalDetails?.experiences;
  const professionalPct = Array.isArray(profData) && profData.length > 0 ? 100 : 0;

  const ecData = profileData.extraCurricularDetails;
  const extraCurricularPct = Array.isArray(ecData) && ecData.length > 0 ? 100 : 0;

  return {
    personal: personal.total > 0 ? Math.round((personal.filled / personal.total) * 100) : 0,
    educational: educational.total > 0 ? Math.round((educational.filled / educational.total) * 100) : 0,
    professional: professionalPct,
    extraCurricular: extraCurricularPct,
  };
};
