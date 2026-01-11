/**
 * Utility functions for parsing formatted location strings
 */

export interface ParsedLocation {
  city: string;
  state: string | null;
  country: string;
}

/**
 * Parse a formatted location string like "New York, New York, United States"
 * into its city, state, and country components.
 * 
 * @param formattedLocation - String in format "City, State, Country" or "City, Country"
 * @returns ParsedLocation object with separated components
 */
export function parseLocationString(formattedLocation: string): ParsedLocation | null {
  if (!formattedLocation || typeof formattedLocation !== 'string') {
    return null;
  }

  const parts = formattedLocation.split(',').map(part => part.trim());
  
  if (parts.length === 3) {
    // Format: "City, State, Country"
    return {
      city: parts[0],
      state: parts[1],
      country: parts[2],
    };
  } else if (parts.length === 2) {
    // Format: "City, Country" (no state)
    return {
      city: parts[0],
      state: null,
      country: parts[1],
    };
  }
  
  return null;
}

/**
 * Format location components into a display string
 * 
 * @param city - City name
 * @param state - State name (optional)
 * @param country - Country name
 * @returns Formatted string like "City, State, Country"
 */
export function formatLocationString(
  city: string,
  state: string | null,
  country: string
): string {
  if (state) {
    return `${city}, ${state}, ${country}`;
  }
  return `${city}, ${country}`;
}

/**
 * Recursively parse location strings in form data.
 * Handles nested objects and arrays (for repeatable fields).
 * 
 * @param data - Form data object
 * @returns Modified data with parsed city, state, country fields
 */
export function parseFormLocationData(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  
  // Helper to process a single object
  const processObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const processed = { ...obj };
    
    // If this object has a city field, parse it
    if (processed.city && typeof processed.city === 'string') {
      const parsed = parseLocationString(processed.city);
      if (parsed) {
        processed.city = parsed.city;
        processed.state = parsed.state || '';
        processed.country = parsed.country;
      }
    }
    
    // Recursively process nested objects
    for (const key in processed) {
      const value = processed[key];
      
      if (Array.isArray(value)) {
        // Process array of objects (repeatable fields)
        processed[key] = value.map(item => {
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
