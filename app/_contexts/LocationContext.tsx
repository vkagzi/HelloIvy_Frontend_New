'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import api from '@/lib/api-client';

export interface Location {
  id: number;
  city: string;
  state: string | null;
  country: string;
}

interface LocationContextValue {
  locations: Location[];
  loading: boolean;
  error: Error | null;
  getCountries: () => string[];
  getStates: (country?: string) => string[];
  getCities: (country?: string, state?: string) => string[];
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchLocations() {
      try {
        setLoading(true);
        const data = await api<Location[]>('/api/locations/locations/');
        setLocations(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load locations'));
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, []);

  const getCountries = () => {
    const countries = new Set(locations.map((loc) => loc.country));
    return Array.from(countries).sort();
  };

  const getStates = (country?: string) => {
    const filtered = country
      ? locations.filter((loc) => loc.country.toLowerCase() === country.toLowerCase())
      : locations;

    const states = new Set(
      filtered
        .map((loc) => loc.state)
        .filter((s): s is string => s !== null && s.trim() !== '')
    );

    return Array.from(states).sort();
  };

  const getCities = (country?: string, state?: string) => {
    let filtered = locations;

    if (country) {
      filtered = filtered.filter(
        (loc) => loc.country.toLowerCase() === country.toLowerCase()
      );
    }

    if (state) {
      filtered = filtered.filter(
        (loc) => loc.state?.toLowerCase() === state.toLowerCase()
      );
    }

    const cities = new Set(filtered.map((loc) => loc.city));
    return Array.from(cities).sort();
  };

  return (
    <LocationContext.Provider
      value={{ locations, loading, error, getCountries, getStates, getCities }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}
