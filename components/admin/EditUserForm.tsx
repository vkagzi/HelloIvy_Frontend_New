'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';
import { ErrorAlert } from '@/components/form/ErrorAlert';
import { FormActions } from '@/components/form/FormActions';
import { useAcademicLevels } from '@/lib/hooks/useAcademicLevels';

export interface EditUserFormValues {
  first_name: string;
  last_name: string;
  is_active: boolean;
  academic_level?: string;
  grade_level?: string;
}

interface EditUserFormProps {
  /** Read-only email displayed at the top */
  email: string;
  initialValues: EditUserFormValues;
  /** Called with the updated field values on submit */
  onSubmit: (values: EditUserFormValues) => Promise<void>;
  onCancel: () => void;
  /** Show both academic_level and grade_level selectors */
  showAcademicFields?: boolean;
  /**
   * When set, hides the academic_level selector but still shows the
   * grade_level selector using this value as the fixed level.
   */
  fixedAcademicLevel?: string;
  saving?: boolean;
  error?: string | null;
  submitLabel?: string;
}

export default function EditUserForm({
  email,
  initialValues,
  onSubmit,
  onCancel,
  showAcademicFields = false,
  fixedAcademicLevel,
  saving = false,
  error = null,
  submitLabel = 'Save Changes',
}: EditUserFormProps) {
  const [form, setForm] = useState<EditUserFormValues>({
    first_name: initialValues.first_name,
    last_name: initialValues.last_name,
    is_active: initialValues.is_active,
    academic_level: initialValues.academic_level ?? '',
    grade_level: initialValues.grade_level ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAcademicLevelChange = (value: string) => {
    setForm((prev) => ({ ...prev, academic_level: value, grade_level: '' }));
  };

  const handleGradeLevelChange = (value: string) => {
    setForm((prev) => ({ ...prev, grade_level: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const { academicLevels, gradeLevels } = useAcademicLevels();

  const effectiveAcademicLevel = fixedAcademicLevel ?? form.academic_level;
  const gradeLevelOptions =
    (showAcademicFields || fixedAcademicLevel) && effectiveAcademicLevel
      ? (gradeLevels[effectiveAcademicLevel] ?? [])
      : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ErrorAlert error={error} />

      {/* Email – read only */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
        <Input type="email" value={email} disabled className="bg-gray-50 text-gray-500" />
      </div>

      {/* Name */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
          <Input
            type="text"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="First name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
          <Input
            type="text"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Last name"
          />
        </div>
      </div>

      {/* Academic fields – opt-in */}
      {(showAcademicFields || fixedAcademicLevel) && (
        <>
          {/* Academic level selector – hidden when fixedAcademicLevel is provided */}
          {showAcademicFields && !fixedAcademicLevel && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Academic Level</label>
              <Select
                value={form.academic_level}
                onValueChange={handleAcademicLevelChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic level" />
                </SelectTrigger>
                <SelectContent>
                  {academicLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Grade Level</label>
            <Select
              value={form.grade_level}
              onValueChange={handleGradeLevelChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grade level" />
              </SelectTrigger>
              <SelectContent>
                {gradeLevelOptions.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Active status */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={form.is_active}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300 text-purple-600"
        />
        <label htmlFor="is_active" className="text-sm text-gray-700">
          Active (user can log in)
        </label>
      </div>

      <FormActions
        isLoading={saving}
        onCancel={onCancel}
        submitLabel={submitLabel}
        cancelLabel="Cancel"
      />
    </form>
  );
}
