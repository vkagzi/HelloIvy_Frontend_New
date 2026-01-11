'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SelectAutofill } from '@/components/ui/select-autofill';
import {
  searchCountries,
  searchCitiesFormatted,
} from '@/lib/api/locations';

interface LocationFieldProps {
  type: 'country' | 'city';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  // Fallback static options
  fallbackOptions?: string[];
}

/**
 * Smart location field that searches API as user types (2+ characters)
 * For city type, returns formatted "City, State, Country" strings
 */
export function LocationField({
  type,
  value,
  onChange,
  error,
  label,
  placeholder,
  required = false,
  disabled = false,
  fallbackOptions = [],
}: LocationFieldProps): React.JSX.Element {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const searchLocations = useCallback(
    async (query: string) => {
      // Clear previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // For city type, allow empty query to show suggestions
      // For country type, require 2+ characters
      if (type === 'country' && (!query || query.length < 2)) {
        setOptions([]);
        setLoading(false);
        return;
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        let results: string[] = [];

        if (type === 'country') {
          results = await searchCountries(query);
        } else if (type === 'city') {
          // Returns formatted strings like "New York, New York, United States"
          // Allow empty query to show suggestions
          results = await searchCitiesFormatted(query);
        }

        setOptions(results);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error searching locations:', err);
          setOptions([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [type]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      // Debounce the search
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        searchLocations(query);
      }, 300);
    },
    [searchLocations]
  );

  const handleValueChange = useCallback(
    (selectedValue: string) => {
      onChange(selectedValue);
    },
    [onChange]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <SelectAutofill
      label={label}
      options={options}
      required={required}
      placeholder={loading ? 'Searching...' : placeholder || 'Type 2+ characters to search'}
      value={value}
      onChange={handleValueChange}
      onSearchChange={handleSearchChange}
      error={error}
      disabled={disabled}
    />
  );
}
