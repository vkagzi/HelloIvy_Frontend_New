'use client';
import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export type InputFieldProps = {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  error?: string;
  hint?: string;
  name?: string;
  type?: string;
  className?: string;
  required?: boolean;
  options?: string[];
  inputHeightClass?: string;
  labelHeightClass?: string;
  readOnly?: boolean;
  inputWidthClass?: string;
};

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value = '',
  onChange,
  onBlur,
  placeholder,
  iconLeft,
  iconRight,
  disabled = false,
  error,
  hint,
  name,
  type = 'text',
  className,
  required = false,
  options = [],
  inputHeightClass,
  labelHeightClass,
  readOnly,
  inputWidthClass,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const containerRef = useRef<HTMLDivElement>(null);

  const showError = Boolean(error);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilteredOptions(
        options.filter((opt) => opt.toLowerCase().includes(value.toLowerCase()))
      );
    }, 100); // debounce delay

    return () => clearTimeout(timeout);
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = (): void => {
    if (type === 'text_select' && options.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = (): void => {
    setTimeout(() => setShowDropdown(false), 100); // allow click on dropdown
    onBlur?.();
  };

  const handleOptionClick = (option: string): void => {
    onChange?.(option);
    setShowDropdown(false);
  };

  return (
    <div className={clsx('grid gap-2 w-full')} ref={containerRef}>
      {label && (
        <label
          htmlFor={name}
          className={clsx(
            'text-sm font-medium',
            labelHeightClass,
            disabled ? 'text-neutral-400' : 'text-neutral-900'
          )}
        >
          {label}
          {required && <span className="ml-1 text-orange-500">*</span>}
        </label>
      )}

      <div
        className={clsx('relative flex w-full items-center', inputWidthClass)}
      >
        {iconLeft && (
          <span className="pointer-events-none absolute left-3 flex items-center">
            {iconLeft}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type === 'text_select' ? 'text' : type}
          disabled={disabled}
          value={value ?? ''}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder || undefined}
          className={clsx(
            'input-field',
            iconLeft && 'pl-10',
            iconRight && 'pr-10',
            inputHeightClass,
            'placeholder:text-sm placeholder:text-neutral-400',
            disabled
              ? 'input-field-disabled'
              : showError && 'input-field-error',
            className && className
          )}
          readOnly={readOnly}
          autoComplete="off"
        />
        {iconRight && (
          <span className="pointer-events-none absolute right-3 flex items-center">
            {iconRight}
          </span>
        )}
        {/* Dropdown for text_select */}
        {type === 'text_select' && options.length > 0 && showDropdown && (
          <ul className="absolute top-full left-0 z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
            {filteredOptions.map((option) => (
              <li
                key={option}
                className="text-sm cursor-pointer px-4 py-2 text-neutral-900 hover:bg-neutral-100"
                onMouseDown={() => handleOptionClick(option)}
              >
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
      {showError ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-sm text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
};

export default InputField;
