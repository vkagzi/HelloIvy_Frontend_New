'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, X } from 'lucide-react';
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

      // Prioritize results that start with the query, then those that contain it.
      if (query && query.trim()) {
        const q = query.toLowerCase();
        const startsWith = results.filter((r) => r.toLowerCase().startsWith(q));
        const includes = results.filter(
          (r) => !r.toLowerCase().startsWith(q) && r.toLowerCase().includes(q)
        );
        const others = results.filter((r) => !r.toLowerCase().includes(q));
        setOptions([...startsWith, ...includes, ...others]);
      } else {
        setOptions(results);
      }
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
    <div className="grid gap-2 w-full">
      {label && (
        <Label className="text-sm font-medium text-neutral-900">
          {label}
          {required && <span className="ml-1 text-orange-500">*</span>}
        </Label>
      )}

      <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild disabled={disabled}>
          <button
            type="button"
            className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-left text-sm shadow-sm transition-colors hover:border-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
            } ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}`}
          >
            <span className={`flex-1 truncate ${!value && 'text-neutral-400'}`}>
              {value || placeholder}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              {value && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onChange('');
                    }
                  }}
                  className="cursor-pointer rounded-full p-1 transition-colors hover:bg-neutral-100"
                >
                  <X className="h-4 w-4 text-neutral-500" />
                </span>
              )}
              <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className={`z-50 min-w-[min(480px,calc(100vw-2rem))] max-w-[600px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg`}
            sideOffset={4}
            align="start"
          >
            {/* Search Input inside dropdown (matches SelectAutofill UX) */}
            <div className="border-b border-neutral-200 p-2">
              <div className="relative">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={loading ? 'Searching...' : 'Type to search...'}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-9 border-neutral-200 pr-10 focus-visible:ring-1 focus-visible:ring-blue-500"
                />
                {loading && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    <svg
                      className="h-4 w-4 text-neutral-500 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-auto p-1">
              {options.length > 0 ? (
                options.map((option, index) => (
                  <button
                    key={`${option}-${index}`}
                    type="button"
                    onClick={() => handleSelectOption(option)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-neutral-100 ${
                      value === option ? 'bg-neutral-50' : ''
                    }`}
                  >
                    <span className="flex-1">{formatLocationDisplay(option)}</span>
                  </button>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-sm text-neutral-500">
                  {searchQuery ? 'No cities found' : 'Start typing to search cities'}
                </div>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {error && <p className="text-sm text-red-500">{error}</p>}
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
