/**
 * Location API client - Search-based approach
 * Fetches data based on user input (2+ characters)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Fetch countries matching search query
 */
export async function searchCountries(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const url = new URL(`${API_BASE_URL}/api/locations/countries/`);
    url.searchParams.set('q', query);
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch countries');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

/**
 * Fetch cities with formatted "City, State, Country" strings
 */
export async function searchCitiesFormatted(
  query: string,
  country?: string,
  state?: string
): Promise<string[]> {
  // Allow empty query to show all cities, but still require minimal fetch on focus
  if (query === undefined || query === null) return [];
  
  try {
    const url = new URL(`${API_BASE_URL}/api/locations/cities/`);
    if (query && query.length > 0) {
      url.searchParams.set('q', query);
    }
    // Request limit of 50 cities
    url.searchParams.set('limit', '50');
    if (country) {
      url.searchParams.set('country', country);
    }
    if (state) {
      url.searchParams.set('state', state);
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch cities');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

/**
 * Back-compat compatibility helpers
 * These functions provide the older `fetchCountries`, `fetchStates`, and
 * `fetchCities` signatures used by some client code. They fetch a full
 * locations list from the server and compute unique values on the client
 * with a small in-memory cache.
 */

export interface Location {
  id: number;
  city: string;
  state: string | null;
  country: string;
}

interface LocationCache {
  data: Location[];
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let locationCache: LocationCache | null = null;

async function fetchAllLocations(): Promise<Location[]> {
  if (locationCache && Date.now() - locationCache.timestamp < CACHE_DURATION) {
    return locationCache.data;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/locations/locations/`);
    if (!response.ok) {
      throw new Error('Failed to fetch locations');
    }
    const data: Location[] = await response.json();

    locationCache = {
      data,
      timestamp: Date.now(),
    };

    return data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return locationCache?.data || [];
  }
}

export async function fetchCountries(): Promise<string[]> {
  const locations = await fetchAllLocations();
  const countries = new Set(locations.map((loc) => loc.country));
  return Array.from(countries).sort();
}

export async function fetchStates(country?: string): Promise<string[]> {
  const locations = await fetchAllLocations();
  const filtered = country
    ? locations.filter((loc) => loc.country.toLowerCase() === country.toLowerCase())
    : locations;

  const states = new Set(
    filtered
      .map((loc) => loc.state)
      .filter((s): s is string => s !== null && s.trim() !== '')
  );

  return Array.from(states).sort();
}

export async function fetchCities(params?: {
  country?: string;
  state?: string;
  q?: string;
}): Promise<string[]> {
  const locations = await fetchAllLocations();
  let filtered = locations;

  if (params?.country) {
    filtered = filtered.filter(
      (loc) => loc.country.toLowerCase() === params.country!.toLowerCase()
    );
  }

  if (params?.state) {
    filtered = filtered.filter(
      (loc) => loc.state?.toLowerCase() === params.state!.toLowerCase()
    );
  }

  if (params?.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (loc) =>
        loc.city.toLowerCase().includes(q) ||
        (loc.state || '').toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q)
    );
  }

  const formatted = filtered.map((loc) => {
    if (loc.state && loc.state.trim() !== '') {
      return `${loc.city}, ${loc.state}, ${loc.country}`;
    }
    return `${loc.city}, ${loc.country}`;
  });

  // Deduplicate and sort
  return Array.from(new Set(formatted)).sort();
}
