'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '@/lib/api-client';
import { useToast } from '@/app/_components/Toast';
import { extractApiError } from '@/lib/utils/api-error';
import { ErrorAlert } from '@/components/form/ErrorAlert';
import { PageHeader } from '@/components/form/PageHeader';
import { FormActions } from '@/components/form/FormActions';
import { Input } from '@/components/ui/input';

export default function CreateOpsAdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const schoolId = session?.user?.school_id;
  const { addToast } = useToast();

  const [form, setForm] = useState({
    email: '',
    send_password_email: true,
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
      await api(`/api/schools/${schoolId}/ops-admins/`, {
        method: 'POST',
        body: {
          email: form.email.trim(),
          send_password_email: form.send_password_email,
        },
      });
      addToast('Operations admin added successfully', { type: 'success' });
      router.push('/school/operations-admin');
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to add operations admin');
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
      <PageHeader backUrl="/school/operations-admin" title="Add Operations Admin" />
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
            placeholder="ops.admin@example.com"
            required
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            name="send_password_email"
            id="send_password_email"
            checked={form.send_password_email}
            onChange={handleChange}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600"
          />
          <div>
            <label htmlFor="send_password_email" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Send temporary password email
            </label>
            <p className="text-xs text-gray-500">
              {form.send_password_email
                ? 'Admin will receive an email with their temporary password.'
                : 'Admin will be created without receiving a password email. You can share credentials manually.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <FormActions isLoading={saving} onCancel={() => router.push('/school/operations-admin')} submitLabel="Add Operations Admin" cancelLabel="Cancel" />
        </div>
      </form>
    </div>
  );
}