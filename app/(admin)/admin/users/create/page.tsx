'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import { useToast } from '@/app/_components/Toast';
import { Button } from '@/components/ui/button';

function extractApiError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message) return err.message;
    const body = (err as any).cause?.body;
    if (body && typeof body === 'object') {
      const messages = Object.entries(body)
        .flatMap(([key, val]) =>
          Array.isArray(val) ? val.map((v) => `${key}: ${v}`) : [`${key}: ${val}`]
        );
      if (messages.length) return messages.join('; ');
    }
  }
  return fallback;
}

interface SchoolOption {
  id: number;
  name: string;
}

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'schooladmin', label: 'School Admin' },
  { value: 'operationadmin', label: 'Operation Admin' },
  { value: 'superadmin', label: 'Superadmin' },
];

const ACADEMIC_LEVELS = [
  { value: 'high_school', label: 'High School (9th–12th grade)' },
  { value: 'undergraduate', label: 'College/Undergraduate' },
  { value: 'postgraduate', label: "Postgraduate/Master's" },
  { value: 'professional', label: 'Working Professional' },
];

const GRADE_LEVELS: Record<string, string[]> = {
  high_school: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
  undergraduate: ['Year 1', 'Year 2', 'Year 3', 'Year 4'],
  postgraduate: ['Year 1', 'Year 2'],
  professional: ['1-3 years', '3-5 years', '5+ years'],
};

export default function CreateUserPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'student',
    school_id: '',
    is_active: true,
    academic_level: '',
    grade_level: '',
  });
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const data = await api<{ schools: SchoolOption[] }>('/api/schools/');
        setSchools(data.schools);
      } catch {
        // Schools list is optional — ignore errors
      }
    };
    fetchSchools();
  }, []);

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
    if (!form.email.trim() || !form.password.trim()) {
      setError('Email and password are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api('/api/accounts/admin/users/', {
        method: 'POST',
        body: {
          email: form.email,
          password: form.password,
          role: form.role,
          school_id: form.school_id ? parseInt(form.school_id) : null,
          is_active: form.is_active,
          academic_level: form.academic_level || null,
          grade_level: form.grade_level || null,
        },
      });
      router.push('/admin/users');
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create user');
      setError(message);
      addToast(message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const showSchoolField = ['student', 'schooladmin'].includes(form.role);
  const gradeOptions = form.academic_level ? (GRADE_LEVELS[form.academic_level] ?? []) : [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Add User</h1>
        <Button
          asChild
          variant="outline"
        >
          <Link href="/admin/users/bulk-import">
            Bulk Import
          </Link>
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Password *
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
            minLength={8}
            placeholder="Minimum 8 characters"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Role *
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {showSchoolField && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              School
            </label>
            <select
              name="school_id"
              value={form.school_id}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">No school</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Academic Level
          </label>
          <select
            name="academic_level"
            value={form.academic_level}
            onChange={(e) => {
              setForm((prev) => ({
                ...prev,
                academic_level: e.target.value,
                grade_level: '',
              }));
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {ACADEMIC_LEVELS.map((al) => (
              <option key={al.value} value={al.value}>
                {al.label}
              </option>
            ))}
          </select>
        </div>

        {gradeOptions.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Grade Level
            </label>
            <select
              name="grade_level"
              value={form.grade_level}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select grade level</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}

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
            Active (user can log in immediately)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/users')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Add User'}
          </Button>
        </div>
      </form>
    </div>
  );
}
