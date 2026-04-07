'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '@/lib/api-client';
import { useToast } from '@/app/_components/Toast';
import { extractApiError } from '@/lib/utils/api-error';
import { ACADEMIC_LEVELS, GRADE_LEVELS } from '@/lib/constants/academic';
import { ErrorAlert } from '@/components/form/ErrorAlert';
import { PageHeader } from '@/components/form/PageHeader';
import { FormActions } from '@/components/form/FormActions';
import { AcademicLevelSelector } from '@/components/form/AcademicLevelSelector';
import { Input } from '@/components/ui/input';

export default function CreateStudentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const schoolId = session?.user?.school_id;
  const { addToast } = useToast();

  const [form, setForm] = useState({
    email: '',
    is_active: true,
    send_password_email: true,
    academic_level: '',
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

  const gradeOptions = form.academic_level ? (GRADE_LEVELS[form.academic_level] ?? []) : [];

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
      <form onSubmit={handleSubmit} className="space-y-5">
        <ErrorAlert error={error} />

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
            Academic Level
          </label>
        </div>

        <AcademicLevelSelector 
          academicLevel={form.academic_level} 
          gradeLevel={form.grade_level}
          onAcademicLevelChange={(v) => setForm((prev) => ({ ...prev, academic_level: v, grade_level: '' }))}
          onGradeLevelChange={(v) => setForm((prev) => ({ ...prev, grade_level: v }))}
        />

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
