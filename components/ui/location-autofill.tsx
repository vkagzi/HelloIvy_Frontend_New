'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { searchCitiesFormatted } from '@/lib/api/locations';
import { parseLocationString } from '@/lib/utils/location-parser';

interface LocationAutofillProps {
  id: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onStateChange?: (state: string) => void;
  onCountryChange?: (country: string) => void;
  stateKey?: string;
  countryKey?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Location autocomplete field that:
 * 1. Searches for cities via API (returns "City, State, Country" format)
 * 2. Parses the selected value to extract city, state, country
 * 3. Updates separate state and country fields via callbacks
 */
export function LocationAutofill({
  id,
  label,
  placeholder = 'Search city...',
  value,
  onChange,
  onStateChange,
  onCountryChange,
  stateKey,
  countryKey,
  error,
  required = false,
  disabled = false,
}: LocationAutofillProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Search for cities
  const searchCities = useCallback(async (query: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const results = await searchCitiesFormatted(query);
      setOptions(results);
      setHighlightedIndex(-1);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error searching cities:', err);
        setOptions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setHighlightedIndex(-1);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        searchCities(query);
      }, 300);
    },
    [searchCities]
  );

  const handleSelectOption = useCallback(
    (option: string) => {
      // Update city field with full formatted string
      onChange(option);

      // Parse the location string to extract state and country
      const parsed = parseLocationString(option);

      if (parsed) {
        // Update state field if callback provided
        if (onStateChange && parsed.state) {
          onStateChange(parsed.state);
        }

        // Update country field if callback provided
        if (onCountryChange && parsed.country) {
          onCountryChange(parsed.country);
        }
      }

      // Close dropdown
      setIsOpen(false);
      setSearchQuery('');
      setOptions([]);
    },
    [onChange, onStateChange, onCountryChange]
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      // Load suggestions when opening
      searchCities('');
    } else {
      setSearchQuery('');
      setOptions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || options.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectOption(options[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

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
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className={required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}>
          {label}
        </Label>
      )}
      <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <Input
            ref={inputRef}
            id={id}
            type="text"
            placeholder={loading ? 'Searching...' : placeholder}
            value={searchQuery || value}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        </Popover.Trigger>
        <Popover.Content
          className="min-w-[480px] max-w-[600px] p-0 z-50"
          side="bottom"
          align="start"
        >
          {options.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto bg-white border rounded-md shadow-md">
              {options.map((option, index) => (
                <div
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  className={`px-4 py-2 cursor-pointer ${
                    index === highlightedIndex
                      ? 'bg-blue-100'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {/* Format location display: City in bold, State/Country in italic gray */}
                  {formatLocationDisplay(option)}
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="px-4 py-3 text-gray-500 text-sm">
              No cities found
            </div>
          ) : (
            <div className="px-4 py-3 text-gray-500 text-sm">
              Start typing to search cities
            </div>
          )}
        </Popover.Content>
      </Popover.Root>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}

/**
 * Format location display with city bold and state/country in italic gray
 * Input: "New York, New York, United States"
 * Output: <bold>New York</bold> <italic gray>, New York, United States</italic>
 */
function formatLocationDisplay(location: string) {
  const parts = location.split(', ');
  if (parts.length === 1) {
    return <span className="font-semibold">{parts[0]}</span>;
  }

  return (
    <>
      <span className="font-semibold">{parts[0]}</span>
      <span className="text-gray-500 italic">, {parts.slice(1).join(', ')}</span>
    </>
  );
}
