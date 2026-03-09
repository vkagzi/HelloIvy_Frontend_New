import React, { useEffect, useRef, useState } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { FieldDefinition } from '@/app/utils/dynamicForm';
import InputField from '@/app/_components/InputField';
import SelectField from '@/app/_components/Select';
import CustomDatePicker from '@/app/_components/CustomDatePicker';
import { MonthYearPicker, formatMonthYear } from '@/app/_components/MonthYearPicker';
import { Checkbox } from '@/app/_components/Checkbox';
import 'react-datepicker/dist/react-datepicker.css';
import { MultiSelect } from '@/components/ui/multi-select';
import { SelectAutofill } from '@/components/ui/select-autofill';
import { LocationField } from '@/components/ui/location-field';
import { LocationAutofill } from '@/components/ui/location-autofill';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FieldRendererProps {
  field: FieldDefinition;
  form: UseFormReturn<Record<string, unknown>>;
  error?: string;
  inputHeightClass: string;
  labelHeightClass: string;
  inputWidthClass?: string;
  disabledField?: boolean;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  form,
  error,
  inputHeightClass,
  labelHeightClass,
  inputWidthClass,
  disabledField = false, // <-- add default
}) => {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showDatePicker) return;
    const handleClick = (event: MouseEvent): void => {
      if (
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDatePicker]);
  
  // Get proper default value based on field type
  const getControllerDefaultValue = (): unknown => {
    const currentValue = form.getValues(field.id);
    if (currentValue !== undefined && currentValue !== null) {
      return currentValue;
    }
    // Set defaults for specific field types
    if (field.type === 'checkbox') return false;
    if (field.type === 'multi_select') return [];
    return '';
  };

  // Resolve options that depend on another field (e.g., country)
  const dependentFieldId = (field as any).optionsDependsOn?.fieldId as
    | string
    | undefined;
  const watchedDepValue = dependentFieldId ? form.watch(dependentFieldId) : undefined;
  
  const resolvedOptions: string[] = React.useMemo(() => {
    const baseOptions = field.options ?? [];
    const od = (field as any).optionsDependsOn;
    if (!od) return baseOptions;
    
    let depVal = Array.isArray(watchedDepValue)
      ? watchedDepValue[0]
      : watchedDepValue;
    
    // If extractCountry flag is set, extract country from "City, State, Country" format
    if (od.extractCountry && typeof depVal === 'string' && depVal.includes(',')) {
      const parts = depVal.split(',').map((p: string) => p.trim());
      depVal = parts[parts.length - 1]; // Get the last part (country)
    }
    
    if (typeof depVal === 'string' && od.map && od.map[depVal]) {
      return od.map[depVal];
    }
    return od.default ?? baseOptions;
  }, [field, watchedDepValue]);

  return (
    <Controller
      name={field.id}
      control={form.control}
      defaultValue={getControllerDefaultValue()}
      render={({ field: controllerField }) => {
        switch (field.type) {
          case 'text':
          case 'number':
          case 'file':
            return (
              <div className="grid gap-2">
                {field.label && (
                  <Label
                    htmlFor={field.id}
                    className={cn(
                      'text-sm font-medium text-neutral-900',
                      disabledField && 'text-neutral-400'
                    )}
                  >
                    {field.label}
                    {field.required && (
                      <span className="ml-1 text-orange-500">*</span>
                    )}
                  </Label>
                )}
                <Input
                  id={field.id}
                  name={field.id}
                  type={field.type === 'file' ? 'text' : field.type}
                  disabled={disabledField}
                  placeholder={field.placeholder}
                  value={
                    typeof controllerField.value === 'string' ||
                    typeof controllerField.value === 'number'
                      ? String(controllerField.value)
                      : ''
                  }
                  onChange={(e) =>
                    field.type === 'number'
                      ? controllerField.onChange(
                          e.target.value === '' ? undefined : Number(e.target.value)
                        )
                      : controllerField.onChange(e.target.value)
                  }
                  onBlur={controllerField.onBlur}
                  aria-invalid={!!error}
                  className={inputWidthClass}
                />
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>
            );
          case 'text_select':
            return (
              <InputField
                disabled={disabledField}
                label={field.label}
                name={field.id}
                type={field.type}
                required={field.required}
                inputWidthClass={inputWidthClass}
                placeholder={field.placeholder}
                inputHeightClass={inputHeightClass}
                labelHeightClass={labelHeightClass}
                value={
                  typeof controllerField.value === 'string' ||
                  typeof controllerField.value === 'number'
                    ? String(controllerField.value)
                    : ''
                }
                onChange={(value: string) => controllerField.onChange(value)}
                onBlur={controllerField.onBlur}
                error={error}
                options={field.options ?? []}
              />
            );
          case 'textarea':
            return (
              <div className="grid gap-2">
                {field.label && (
                  <Label
                    htmlFor={field.id}
                    className={cn(
                      'text-sm font-medium text-neutral-900',
                      disabledField && 'text-neutral-400'
                    )}
                  >
                    {field.label}
                    {field.required && (
                      <span className="ml-1 text-orange-500">*</span>
                    )}
                  </Label>
                )}
                <Textarea
                  id={field.id}
                  name={field.id}
                  disabled={disabledField}
                  placeholder={field.placeholder}
                  value={
                    typeof controllerField.value === 'string'
                      ? controllerField.value
                      : ''
                  }
                  onChange={(e) => controllerField.onChange(e.target.value)}
                  onBlur={controllerField.onBlur}
                  aria-invalid={!!error}
                />
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>
            );
          case 'checkbox':
            return (
              <div className="flex items-center gap-3">
                <Checkbox
                  disabled={disabledField}
                  id={field.id}
                  checked={controllerField.value === true}
                  onCheckedChange={(checked) =>
                    controllerField.onChange(Boolean(checked))
                  }
                  ref={controllerField.ref}
                />
                <Label
                  htmlFor={field.id}
                  className={cn(
                    'text-sm font-medium text-neutral-800 cursor-pointer',
                    disabledField && 'text-neutral-400 cursor-not-allowed'
                  )}
                >
                  {field.label}
                  {field.required && (
                    <span className="ml-1 text-orange-500">*</span>
                  )}
                </Label>
              </div>
            );
          case 'select':
            return (
              <SelectField
                id={field.id}
                label={field.label}
                value={
                  typeof controllerField.value === 'string'
                    ? controllerField.value
                    : ''
                }
                onChange={(value) => controllerField.onChange(value)}
                error={error}
                options={resolvedOptions}
                required={field.required}
                disabled={disabledField}
                placeholder={field.placeholder}
              />
            );
          case 'radio':
            return (
              <div id={field.id} className="grid gap-2">
                <Label
                  className="text-sm font-medium text-neutral-900"
                >
                  {field.label}
                  {field.required && (
                    <span className="ml-1 text-orange-500">*</span>
                  )}
                </Label>
                <div className="flex flex-wrap gap-4">
                  {resolvedOptions?.map((option) => (
                    <Label
                      key={option}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer text-sm font-normal',
                        disabledField && 'cursor-not-allowed opacity-50'
                      )}
                    >
                      <input
                        type="radio"
                        name={field.id}
                        value={option}
                        checked={controllerField.value === option}
                        onChange={() => controllerField.onChange(option)}
                        onBlur={controllerField.onBlur}
                        ref={controllerField.ref}
                        className="h-4 w-4 border-neutral-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                        disabled={disabledField}
                      />
                      <span className="text-neutral-700">
                        {option}
                      </span>
                    </Label>
                  ))}
                </div>
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>
            );
          case 'date':
            return (
              <div
                className="relative"
                ref={anchorRef}
                onClick={() => setShowDatePicker(true)}
                tabIndex={0}
                role="button"
                aria-label={`Select ${field.label}`}
              >
                <InputField
                  label={field.label}
                  inputHeightClass={inputHeightClass}
                  labelHeightClass={labelHeightClass}
                  name={field.id}
                  type="text"
                  required={field.required}
                  placeholder={field.placeholder}
                  value={
                    typeof controllerField.value === 'string' && controllerField.value
                      ? (() => {
                          // Format YYYY-MM-DD to DD/MM/YYYY for display
                          const match = controllerField.value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                          if (match) return `${match[3]}/${match[2]}/${match[1]}`;
                          return controllerField.value;
                        })()
                      : ''
                  }
                  onChange={() => undefined}
                  onBlur={controllerField.onBlur}
                  error={error}
                  iconRight={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="h-4 w-4 text-neutral-500"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="16"
                        rx="4"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        fill="none"
                      />
                      <path
                        d="M16 3v4M8 3v4M3 9h18"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        strokeLinecap="round"
                      />
                      <circle cx="8" cy="13" r="1" fill="currentColor" />
                      <circle cx="12" cy="13" r="1" fill="currentColor" />
                      <circle cx="16" cy="13" r="1" fill="currentColor" />
                    </svg>
                  }
                  readOnly={true}
                  inputWidthClass={inputWidthClass}
                />
                <CustomDatePicker
                  value={controllerField.value as string}
                  onChange={controllerField.onChange}
                  open={showDatePicker}
                  onClose={() => setShowDatePicker(false)}
                  anchorRef={anchorRef}
                />
              </div>
            );
          case 'month_year':
            return (
              <div
                className="relative"
                ref={anchorRef}
                onClick={() => setShowDatePicker(true)}
                tabIndex={0}
                role="button"
                aria-label={`Select ${field.label}`}
              >
                <InputField
                  label={field.label}
                  inputHeightClass={inputHeightClass}
                  labelHeightClass={labelHeightClass}
                  name={field.id}
                  type="text"
                  required={field.required}
                  placeholder={field.placeholder}
                  value={
                    typeof controllerField.value === 'string'
                      ? formatMonthYear(controllerField.value)
                      : ''
                  }
                  onChange={() => undefined}
                  onBlur={controllerField.onBlur}
                  error={error}
                  iconRight={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="h-4 w-4 text-neutral-500"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="16"
                        rx="4"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        fill="none"
                      />
                      <path
                        d="M16 3v4M8 3v4M3 9h18"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        strokeLinecap="round"
                      />
                    </svg>
                  }
                  readOnly={true}
                  inputWidthClass={inputWidthClass}
                />
                <MonthYearPicker
                  value={controllerField.value as string}
                  onChange={controllerField.onChange}
                  open={showDatePicker}
                  onClose={() => setShowDatePicker(false)}
                  anchorRef={anchorRef}
                />
              </div>
            );
          case 'multi_select':
            console.log('Rendering multi_select for field:', field.id, 'with value:', controllerField.value);
            console.log('Options:', field);
            return (
              <MultiSelect
                id={field.id}
                label={field.label}
                options={resolvedOptions}
                required={field.required}
                placeholder={field.placeholder}
                value={Array.isArray(controllerField.value) ? controllerField.value : []}
                onChange={controllerField.onChange}
                error={error}
              />
            );
          case 'select_autofill':
            // Check if this is a location field (city or country)
            // Includes: city, courseCity, and country/citizenShip
            const isLocationField = 
              field.id === 'city' || 
              field.id === 'courseCity' ||
              field.id === 'country' ||
              field.id === 'citizenShip';
            
            if (isLocationField) {
              const locationType: 'country' | 'city' = 
                field.id === 'country' || field.id === 'citizenShip' ? 'country' : 'city';
              
              return (
                <LocationField
                  id={field.id}
                  type={locationType}
                  label={field.label}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={
                    typeof controllerField.value === 'string'
                      ? controllerField.value
                      : ''
                  }
                  onChange={controllerField.onChange}
                  error={error}
                  disabled={disabledField}
                  fallbackOptions={resolvedOptions}
                />
              );
            }
            
            return (
              <SelectAutofill
                id={field.id}
                label={field.label}
                options={resolvedOptions}
                required={field.required}
                placeholder={field.placeholder}
                value={
                  typeof controllerField.value === 'string'
                    ? controllerField.value
                    : ''
                }
                onChange={controllerField.onChange}
                error={error}
                disabled={disabledField}
              />
            );
          case 'location_autofill':
            return (
              <LocationAutofill
                id={field.id}
                label={field.label}
                required={field.required}
                placeholder={field.placeholder}
                value={
                  typeof controllerField.value === 'string'
                    ? controllerField.value
                    : ''
                }
                onChange={controllerField.onChange}
                onStateChange={
                  (field as any).stateKey
                    ? (value: string) => {
                        form.setValue((field as any).stateKey, value);
                      }
                    : undefined
                }
                onCountryChange={
                  (field as any).countryKey
                    ? (value: string) => {
                        form.setValue((field as any).countryKey, value);
                      }
                    : undefined
                }
                stateKey={(field as any).stateKey}
                countryKey={(field as any).countryKey}
                error={error}
                disabled={disabledField}
              />
            );
          default:
            return (
              <InputField
                label={field.label}
                inputHeightClass={inputHeightClass}
                labelHeightClass={labelHeightClass}
                name={field.id}
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                value={controllerField.value as string}
                onChange={controllerField.onChange}
                onBlur={controllerField.onBlur}
                error={error}
                inputWidthClass={inputWidthClass}
                options={field.options}
              />
            );
        }
      }}
    />
  );
};
