/**
 * Transform form data to reconstruct formatted location strings
 * Used when loading saved profile data to show "City, State, Country" format
 */

export interface LocationData {
  city?: string;
  state?: string;
  country?: string;
  [key: string]: unknown;
}

/**
 * Reconstruct formatted city string from separate city, state, country values
 * Combines them back to "City, State, Country" format for display
 */
export function reconstructFormLocationData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...data };

  // Helper to process a single object
  // Extract just the 4-digit year from a date string (e.g. "2023-01-01" → "2023")
  const normalizeYearField = (value: unknown): string | unknown => {
    if (typeof value !== 'string' || !value) return value;
    // Already a 4-digit year
    if (/^\d{4}$/.test(value)) return value;
    // ISO date: YYYY-MM-DD
    const isoMatch = value.match(/^(\d{4})-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[1];
    // Fallback: extract first 4-digit sequence
    const anyYear = value.match(/\d{4}/);
    if (anyYear) return anyYear[0];
    return value;
  };

  const processObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const processed = { ...obj };

    // Normalize year-only fields
    if (processed.startYear !== undefined) {
      processed.startYear = normalizeYearField(processed.startYear);
    }
    if (processed.endYear !== undefined) {
      processed.endYear = normalizeYearField(processed.endYear);
    }

    // If this object has separate city, state, country fields, combine them
    if (processed.city && (processed.state || processed.country)) {
      const city = String(processed.city || '');
      const state = processed.state ? String(processed.state) : null;
      const country = processed.country ? String(processed.country) : '';

      // Format: "City, State, Country" or "City, Country" if no state
      if (state && state.trim()) {
        processed.city = `${city}, ${state}, ${country}`;
      } else if (city && country) {
        processed.city = `${city}, ${country}`;
      }

      // Clear the separate fields since they're now in the city field
      processed.state = '';
      processed.country = '';
    }

    // Recursively process nested objects and arrays (for repeatable fields)
    for (const key in processed) {
      const value = processed[key];

      if (Array.isArray(value)) {
        // Process array of objects (repeatable fields)
        processed[key] = value.map((item) => {
          if (typeof item === 'object' && item !== null) {
            return processObject(item as Record<string, unknown>);
          }
          return item;
        });
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Process nested object
        processed[key] = processObject(value as Record<string, unknown>);
      }
    }

    return processed;
  };

  return processObject(result);
}
