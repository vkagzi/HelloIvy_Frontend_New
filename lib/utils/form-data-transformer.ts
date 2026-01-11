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
  const processObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const processed = { ...obj };

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
