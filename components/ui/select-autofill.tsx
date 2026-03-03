'use client';

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SelectAutofillProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  options: string[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onSearchChange?: (query: string) => void;
}

/**
 * Parse and format a location string like "City, State, Country" for display
 * Shows city in regular text and state/country in italic
 */
function formatLocationDisplay(option: string): React.JSX.Element | string {
  // Check if this looks like a location string (contains commas)
  if (!option.includes(',')) {
    return option;
  }

  const parts = option.split(',').map(p => p.trim());
  
  if (parts.length === 3) {
    // Format: "City, State, Country"
    return (
      <span>
        <span className="font-medium">{parts[0]}</span>
        <span className="text-neutral-600">, </span>
        <span className="italic text-neutral-600">{parts[1]}</span>
        <span className="text-neutral-600">, </span>
        <span className="italic text-neutral-600">{parts[2]}</span>
      </span>
    );
  } else if (parts.length === 2) {
    // Format: "City, Country"
    return (
      <span>
        <span className="font-medium">{parts[0]}</span>
        <span className="text-neutral-600">, </span>
        <span className="italic text-neutral-600">{parts[1]}</span>
      </span>
    );
  }
  
  return option;
}

export function SelectAutofill({
  value = '',
  onChange,
  error,
  options,
  label,
  placeholder = 'Search and select...',
  required = false,
  disabled = false,
  className,
  onSearchChange,
}: SelectAutofillProps): React.JSX.Element {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const optionsRef = React.useRef<HTMLDivElement>(null);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, searchQuery]);

  const handleOptionSelect = (option: string): void => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent | React.KeyboardEvent): void => {
    e.stopPropagation();
    onChange('');
  };

  const handleOpenChange = (open: boolean): void => {
    setIsOpen(open);
    if (open) {
      // Focus the input when opening
      setTimeout(() => inputRef.current?.focus(), 0);
      // Trigger search immediately with empty query to load suggestions
      if (onSearchChange) {
        onSearchChange('');
      }
    } else {
      // Clear search when closing
      setSearchQuery('');
    }
  };

  const handleSearchChange = (value: string): void => {
    setSearchQuery(value);
    setHighlightedIndex(-1);
    // Notify parent component about search query changes
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
        // Scroll highlighted option into view
        setTimeout(() => {
          const container = optionsRef.current;
          if (container) {
            const items = container.querySelectorAll('button');
            items[next]?.scrollIntoView({ block: 'nearest' });
          }
        }, 0);
        return next;
      });
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
        setTimeout(() => {
          const container = optionsRef.current;
          if (container) {
            const items = container.querySelectorAll('button');
            items[next]?.scrollIntoView({ block: 'nearest' });
          }
        }, 0);
        return next;
      });
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleOptionSelect(filteredOptions[highlightedIndex]);
      } else if (filteredOptions.length === 1) {
        handleOptionSelect(filteredOptions[0]);
      }
    }
  };

  return (
    <div className={cn('grid gap-2 w-full', className)}>
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
            className={cn(
              'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-left text-sm shadow-sm transition-colors',
              'hover:border-neutral-400',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error &&
                'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              isOpen && 'border-blue-500 ring-2 ring-blue-500/20'
            )}
          >
            <span
              className={cn('flex-1 truncate', !value && 'text-neutral-400')}
            >
              {value || placeholder}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              {value && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleClear(e);
                    }
                  }}
                  className="cursor-pointer rounded-full p-1 transition-colors hover:bg-neutral-100"
                >
                  <X className="h-4 w-4 text-neutral-500" />
                </span>
              )}
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-neutral-500 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className={cn(
              'z-50 min-w-[min(480px,calc(100vw-2rem))] max-w-[600px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
            )}
            sideOffset={4}
            align="start"
          >
            {/* Search Input */}
            <div className="border-b border-neutral-200 p-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Type to search..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 border-neutral-200 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-auto p-1" ref={optionsRef}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, idx) => {
                  const isSelected = value === option;
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={`${option}-${idx}`}
                      type="button"
                      onClick={() => handleOptionSelect(option)}
                      className={cn(
                        'flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                        'hover:bg-neutral-100',
                        isSelected && 'bg-neutral-50',
                        isHighlighted && 'bg-blue-50 ring-1 ring-blue-200'
                      )}
                    >
                      <span className="flex-1">{formatLocationDisplay(option)}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-blue-500" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-2 py-4 text-center text-sm text-neutral-500">
                  {searchQuery
                    ? 'No matching options found'
                    : 'No options available'}
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
