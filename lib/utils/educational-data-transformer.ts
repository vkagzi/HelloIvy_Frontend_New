/**
 * Transform educational form data to proper structure
 * Converts flat form structure to nested degree/year structure with year identifiers
 */

export function transformEducationalData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...data };

  // Transform highSchool data – ensure each year object has a gradeLevel identifier
  if (result.highSchool && Array.isArray(result.highSchool)) {
    result.highSchool = (result.highSchool as Record<string, unknown>[]).map(
      (yearEntry) => transformHighSchoolYear(yearEntry)
    );
  }   

  // Transform undergraduate data
  if (result.undergraduate && Array.isArray(result.undergraduate)) {
    result.undergraduate = (result.undergraduate as Record<string, unknown>[]).map(
      (degree) => transformDegree(degree)
    );
  }

  // Transform postgraduate data
  if (result.postgraduate && Array.isArray(result.postgraduate)) {
    result.postgraduate = (result.postgraduate as Record<string, unknown>[]).map(
      (degree) => transformDegree(degree)
    );
  }

  // Transform tenPlus (Working/Completed College) data
  if (result.tenPlus && Array.isArray(result.tenPlus)) {
    result.tenPlus = (result.tenPlus as Record<string, unknown>[]).map(
      (degree) => transformDegree(degree)
    );
  }

  // Transform undergraduate_prereq data
  if (result.undergraduate_prereq && Array.isArray(result.undergraduate_prereq)) {
    result.undergraduate_prereq = (result.undergraduate_prereq as Record<string, unknown>[]).map(
      (degree) => transformDegree(degree)
    );
  }

  return result;
}

/**
 * Transform a single high school year object to ensure it has a gradeLevel identifier
 */
function transformHighSchoolYear(yearEntry: Record<string, unknown>): Record<string, unknown> {
  const transformed = { ...yearEntry };

  // Ensure gradeLevel is a number for reliable mapping
  if (transformed.gradeLevel !== undefined) {
    const parsed = typeof transformed.gradeLevel === 'number'
      ? transformed.gradeLevel
      : parseInt(String(transformed.gradeLevel), 10);
    if (!isNaN(parsed)) {
      transformed.gradeLevel = parsed;
    }
  }

  // Remove legacy 'grade' field if present (migrated to gradeLevel)
  if ('grade' in transformed) {
    if (transformed.gradeLevel === undefined) {
      const parsed = typeof transformed.grade === 'number'
        ? transformed.grade
        : parseInt(String(transformed.grade), 10);
      if (!isNaN(parsed)) {
        transformed.gradeLevel = parsed;
      }
    }
    delete transformed.grade;
  }

  return transformed;
}

/**
 * Transform a single degree object to include year identifiers
 */
function transformDegree(degree: Record<string, unknown>): Record<string, unknown> {
  const transformed = { ...degree };

  // Transform years array to include year identifiers
  if (transformed.years && Array.isArray(transformed.years)) {
    transformed.years = (transformed.years as Record<string, unknown>[]).map(
      (year, index) => ({
        year: year.year !== undefined ? year.year : index + 1,
        ...Object.fromEntries(
          Object.entries(year).filter(([key]) => key !== 'year')
        ),
      })
    );
  }

  return transformed;
}

/**
 * Parse educational data from API response to form structure
 * Converts nested structure with year identifiers back to flat form structure
 */
export function parseEducationalData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...data };

  // Parse highSchool data
  if (result.highSchool && Array.isArray(result.highSchool)) {
    result.highSchool = (result.highSchool as Record<string, unknown>[]).map(
      (yearEntry) => parseHighSchoolYear(yearEntry)
    );
  }

  // Parse undergraduate data
  if (result.undergraduate && Array.isArray(result.undergraduate)) {
    result.undergraduate = (result.undergraduate as Record<string, unknown>[]).map(
      (degree) => parseDegree(degree)
    );
  }

  // Parse postgraduate data
  if (result.postgraduate && Array.isArray(result.postgraduate)) {
    result.postgraduate = (result.postgraduate as Record<string, unknown>[]).map(
      (degree) => parseDegree(degree)
    );
  }

  // Parse tenPlus (Working/Completed College) data
  if (result.tenPlus && Array.isArray(result.tenPlus)) {
    result.tenPlus = (result.tenPlus as Record<string, unknown>[]).map(
      (degree) => parseDegree(degree)
    );
  }

  // Parse undergraduate_prereq data
  if (result.undergraduate_prereq && Array.isArray(result.undergraduate_prereq)) {
    result.undergraduate_prereq = (result.undergraduate_prereq as Record<string, unknown>[]).map(
      (degree) => parseDegree(degree)
    );
  }

  return result;
}

/**
 * Parse a single high school year object from API format
 * Ensures gradeLevel is preserved for form mapping
 */
function parseHighSchoolYear(yearEntry: Record<string, unknown>): Record<string, unknown> {
  const parsed = { ...yearEntry };

  // Migrate legacy 'grade' field to 'gradeLevel' if needed
  if (parsed.grade !== undefined && parsed.gradeLevel === undefined) {
    const g = typeof parsed.grade === 'number'
      ? parsed.grade
      : parseInt(String(parsed.grade), 10);
    if (!isNaN(g)) {
      parsed.gradeLevel = g;
    }
    delete parsed.grade;
  }

  return parsed;
}

/**
 * Parse a single degree object from API format
 */
function parseDegree(degree: Record<string, unknown>): Record<string, unknown> {
  const parsed = { ...degree };

  // Ensure years array has proper structure
  if (parsed.years && Array.isArray(parsed.years)) {
    parsed.years = (parsed.years as Record<string, unknown>[]).map((year) => {
      // Keep the year field if it exists, otherwise it will be set by form index
      return { ...year };
    });
  }

  return parsed;
}
