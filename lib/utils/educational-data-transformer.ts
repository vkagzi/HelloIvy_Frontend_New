/**
 * Transform educational form data to proper structure
 * Converts flat form structure to nested degree/year structure with year identifiers
 */

export function transformEducationalData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...data };

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

  return result;
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

  return result;
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
