'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchCountries, fetchStates, fetchCities } from '@/lib/api/locations';

// Shared state to prevent duplicate fetches across components
let countriesCache: string[] | null = null;
let countriesPromise: Promise<string[]> | null = null;

/**
 * Hook to fetch and manage countries list (singleton pattern)
 */
export function useCountries() {
  const [countries, setCountries] = useState<string[]>(countriesCache || []);
  const [loading, setLoading] = useState(!countriesCache);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    async function loadCountries() {
      // Return cached data immediately
      if (countriesCache) {
        if (isMounted.current) {
          setCountries(countriesCache);
          setLoading(false);
        }
        return;
      }

      // Wait for existing fetch if one is in progress
      if (countriesPromise) {
        try {
          const data = await countriesPromise;
          if (isMounted.current) {
            setCountries(data);
            setLoading(false);
          }
        } catch (err) {
          if (isMounted.current) {
            setError(err instanceof Error ? err : new Error('Failed to load countries'));
            setLoading(false);
          }
        }
        return;
      }

      // Start new fetch
      try {
        setLoading(true);
        countriesPromise = fetchCountries();
        const data = await countriesPromise;
        countriesCache = data;
        
        if (isMounted.current) {
          setCountries(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error('Failed to load countries'));
        }
      } finally {
        countriesPromise = null;
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }

    loadCountries();

    return () => {
      isMounted.current = false;
    };
  }, []);

  return { countries, loading, error };
}

/**
 * Hook to fetch and manage states list for a given country
 */
export function useStates(country?: string) {
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  const fetchedCountryRef = useRef<string | undefined | null>(null);

  useEffect(() => {
    isMounted.current = true;

    async function loadStates() {
      if (!country) {
        setStates([]);
        setLoading(false);
        fetchedCountryRef.current = undefined;
        return;
      }

      // Skip if already fetched for this country
      if (fetchedCountryRef.current === country) {
        return;
      }

      try {
        setLoading(true);
        const data = await fetchStates(country);
        fetchedCountryRef.current = country;
        
        if (isMounted.current) {
          setStates(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error('Failed to load states'));
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }

    loadStates();

    return () => {
      isMounted.current = false;
    };
  }, [country]);

  return { states, loading, error };
}

/**
 * Hook to fetch and manage cities list with optional filters
 */
export function useCities(filters?: { country?: string; state?: string; q?: string }) {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  const fetchedFiltersRef = useRef<string | null>(null);

  useEffect(() => {
    isMounted.current = true;

    async function loadCities() {
      // Create a stable key for filters
      const filterKey = JSON.stringify(filters || {});
      
      // Skip if already fetched with same filters
      if (fetchedFiltersRef.current === filterKey) {
        return;
      }

      try {
        setLoading(true);
        const data = await fetchCities(filters);
        fetchedFiltersRef.current = filterKey;
        
        if (isMounted.current) {
          setCities(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error('Failed to load cities'));
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }

    loadCities();

    return () => {
      isMounted.current = false;
    };
  }, [filters?.country, filters?.state, filters?.q]);

  return { cities, loading, error };
}
