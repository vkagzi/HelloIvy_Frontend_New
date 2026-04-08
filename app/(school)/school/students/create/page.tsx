'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '@/lib/api-client';
import { useToast } from '@/app/_components/Toast';
import { extractApiError } from '@/lib/utils/api-error';
import { GRADE_LEVELS } from '@/lib/constants/academic';
import { ErrorAlert } from '@/components/form/ErrorAlert';
import { PageHeader } from '@/components/form/PageHeader';
import { FormActions } from '@/components/form/FormActions';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';

export default function CreateStudentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const schoolId = session?.user?.school_id;
  const schoolName = session?.user?.school_name;
  const { addToast } = useToast();

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    is_active: true,
    send_password_email: true,
    academic_level: 'high_school',
    grade_level: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!schoolId) {
      setError('School ID is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api('/api/accounts/admin/users/', {
        method: 'POST',
        body: {
          email: form.email,
          role: 'student',
          school_id: schoolId,
          first_name: form.first_name || undefined,
          last_name: form.last_name || undefined,
          is_active: form.is_active,
          send_password_email: form.send_password_email,
          academic_level: form.academic_level || null,
          grade_level: form.grade_level || null,
        },
      });
      router.push('/school/students');
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create student');
      setError(message);
      addToast(message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!schoolId) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-700">
          No school is associated with your account. Please contact an administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader backUrl="/school/students" title="Create Student" />
      {schoolName && (
        <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-sm text-blue-700">
            This student will be added under <span className="font-semibold">{schoolName}</span>.
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorAlert error={error} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              First Name
            </label>
            <Input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              placeholder="First name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <Input
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email *
          </label>
          <Input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Grade Level
          </label>
          <Select value={form.grade_level} onValueChange={(v) => setForm((prev) => ({ ...prev, grade_level: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select grade level" />
            </SelectTrigger>
            <SelectContent>
              {(GRADE_LEVELS['high_school'] ?? []).map((grade) => (
                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            name="send_password_email"
            id="send_password_email"
            checked={form.send_password_email}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-purple-600"
          />
          <label htmlFor="send_password_email" className="block text-sm font-medium text-gray-700 cursor-pointer">
            Send temporary password email
          </label>
          <p className="text-xs text-gray-500">
            {form.send_password_email
              ? 'Student will receive an email with their temporary password.'
              : 'Student will be created without receiving a password email. You can share credentials manually.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-purple-600"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">
            Active (student can log in immediately)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <FormActions isLoading={saving} onCancel={() => router.push('/school/students')} submitLabel="Create Student" cancelLabel="Cancel" />
        </div>
      </form>
    </div>
  );
}
