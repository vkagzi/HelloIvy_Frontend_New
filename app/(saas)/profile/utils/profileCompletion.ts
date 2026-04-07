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
 *
 * Accepts the profile section objects as extracted by ProfileContext.
 * The result mirrors what the backend returns in `completion_percentage`.
 */
export const calculateProfileCompletion = (profileData: {
  personalDetails?: ProfileData;
  educationalDetails?: ProfileData;
  extraCurricularDetails?: unknown;
}): number => {
  let totalFilled = 0;
  let totalRequired = 0;

  // 1. Personal details – 11 individual required fields
  const personal = countFilledFields(
    profileData.personalDetails ?? {},
    PERSONAL_REQUIRED_FIELDS,
  );
  totalFilled += personal.filled;
  totalRequired += personal.total;

  // 2. Educational – 1 required field
  const educational = countFilledFields(
    profileData.educationalDetails ?? {},
    EDUCATIONAL_REQUIRED_FIELDS,
  );
  totalFilled += educational.filled;
  totalRequired += educational.total;

  // 3. Extra-curricular – non-empty array counts as 1
  totalRequired += 1;
  const ecData = profileData.extraCurricularDetails;
  if (Array.isArray(ecData) && ecData.length > 0) {
    totalFilled += 1;
  }

  if (totalRequired === 0) return 0;
  return Math.round((totalFilled / totalRequired) * 100);
};

/**
 * Get completion status broken down by section.
 */
export const getSectionCompletionDetails = (profileData: {
  personalDetails?: ProfileData;
  educationalDetails?: ProfileData;
  extraCurricularDetails?: unknown;
}): {
  personal: number;
  educational: number;
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

  const ecData = profileData.extraCurricularDetails;
  const extraCurricularPct = Array.isArray(ecData) && ecData.length > 0 ? 100 : 0;

  return {
    personal: personal.total > 0 ? Math.round((personal.filled / personal.total) * 100) : 0,
    educational: educational.total > 0 ? Math.round((educational.filled / educational.total) * 100) : 0,
    extraCurricular: extraCurricularPct,
  };
};
