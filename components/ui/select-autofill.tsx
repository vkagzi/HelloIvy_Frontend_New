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
}: SelectAutofillProps): React.JSX.Element {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const inputRef = React.useRef<HTMLInputElement>(null);

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
    } else {
      // Clear search when closing
      setSearchQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
    if (e.key === 'Enter' && filteredOptions.length === 1) {
      e.preventDefault();
      handleOptionSelect(filteredOptions[0]);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
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
              'z-50 w-(--radix-popover-trigger-width) overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg',
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
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 border-neutral-200 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-auto p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = value === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleOptionSelect(option)}
                      className={cn(
                        'flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                        'hover:bg-neutral-100',
                        isSelected && 'bg-neutral-50'
                      )}
                    >
                      <span className="text-left text-neutral-900">{option}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-500" />
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
