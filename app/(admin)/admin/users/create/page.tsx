'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import api from '@/lib/api-client';
import { useToast } from '@/app/_components/Toast';
import { extractApiError } from '@/lib/utils/api-error';
import { ACADEMIC_LEVELS, GRADE_LEVELS } from '@/lib/constants/academic';
import { ErrorAlert } from '@/components/form/ErrorAlert';
import { FormActions } from '@/components/form/FormActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';
import { ADMIN_CREATE_ROLES } from '@/lib/constants/roles';

interface SchoolOption {
  id: number;
  name: string;
}

type PageType = 'b2c' | 'schoolusers' | 'admin' | 'schooladmin' | null;

function getPageConfig(type: PageType) {
  switch (type) {
    case 'b2c':
      return {
        title: 'Create B2C Student',
        showBulkImport: false,
        fixedRole: 'student' as const,
        showSchool: false,
        showAcademic: true,
        backUrl: '/admin/users?type=b2c',
      };
    case 'schoolusers':
      return {
        title: 'Create School Student',
        showBulkImport: true,
        fixedRole: 'student' as const,
        showSchool: true,
        showAcademic: true,
        backUrl: '/admin/users?type=schoolusers',
      };
    case 'admin':
      return {
        title: 'Create Admin User',
        showBulkImport: false,
        fixedRole: null,
        showSchool: false, // conditionally shown based on role
        showAcademic: false,
        backUrl: '/admin/users?type=admin',
      };
    case 'schooladmin':
      return {
        title: 'Add School Admin',
        showBulkImport: false,
        fixedRole: 'schooladmin' as const,
        showSchool: true,
        showAcademic: false,
        backUrl: '/admin/users?type=admin',
      };
    default:
      return {
        title: 'Add User',
        showBulkImport: true,
        fixedRole: null,
        showSchool: true,
        showAcademic: true,
        backUrl: '/admin/users',
      };
  }
}

export default function CreateUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Redirect operationadmin away from create user page
  useEffect(() => {
    if (session?.user?.role === 'operationadmin') {
      router.replace('/admin/users');
    }
  }, [session, router]);
  const typeParam = (searchParams?.get('type') ?? null) as PageType;
  const schoolIdParam = searchParams?.get('schoolId') ?? '';
  const config = getPageConfig(typeParam);

  // If coming from a school detail page, go back there after creation
  const backUrl = schoolIdParam && (typeParam === 'schooladmin' || typeParam === 'schoolusers')
    ? `/admin/schools/${schoolIdParam}`
    : config.backUrl;

  const { addToast } = useToast();
  const [form, setForm] = useState({
    email: '',
    role: config.fixedRole ?? 'superadmin',
    school_id: schoolIdParam,
    is_active: true,
    send_password_email: true,
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
      // Clear school when role changes away from school-related roles
      ...(name === 'role' && !['schooladmin', 'schoolopsadmin'].includes(value)
        ? { school_id: '' }
        : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const role = config.fixedRole ?? form.role;
      await api('/api/accounts/admin/users/', {
        method: 'POST',
        body: {
          email: form.email,
          role,
          school_id: form.school_id ? parseInt(form.school_id) : null,
          is_active: form.is_active,
          send_password_email: form.send_password_email,
          academic_level: config.showAcademic ? form.academic_level || null : null,
          grade_level: config.showAcademic ? form.grade_level || null : null,
        },
      });
      router.push(backUrl);
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create user');
      setError(message);
      addToast(message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // For admin type, show school field only when the selected role is schooladmin or schoolopsadmin
  const showSchoolField =
    typeParam === 'admin'
      ? ['schooladmin', 'schoolopsadmin'].includes(form.role)
      : config.showSchool;

  const gradeOptions = form.academic_level ? (GRADE_LEVELS[form.academic_level] ?? []) : [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={backUrl}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
        </div>
        {config.showBulkImport && (
          <Button asChild variant="outline">
            <Link href="/admin/users/bulk-import">Bulk Import</Link>
          </Button>
        )}
      </div>
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

        {/* Role selector — hidden when role is fixed (b2c / schoolusers) */}
        {!config.fixedRole && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Role *
            </label>
            <Select value={form.role} onValueChange={(v) => setForm((prev) => ({ ...prev, role: v, ...(!['schooladmin', 'schoolopsadmin'].includes(v) ? { school_id: '' } : {}) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(typeParam === 'admin' ? ADMIN_CREATE_ROLES : ADMIN_CREATE_ROLES).map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showSchoolField && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              School{typeParam === 'schoolusers' || typeParam === 'schooladmin' ? ' *' : ''}
            </label>
            <Select value={form.school_id} onValueChange={(v) => setForm((prev) => ({ ...prev, school_id: v }))} disabled={!!schoolIdParam}>
              <SelectTrigger>
                <SelectValue placeholder="Select a school..." />
              </SelectTrigger>
              <SelectContent>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {config.showAcademic && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Academic Level
              </label>
              <Select value={form.academic_level || '__none__'} onValueChange={(v) => setForm((prev) => ({ ...prev, academic_level: v === '__none__' ? '' : v, grade_level: '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {ACADEMIC_LEVELS.map((al) => (
                    <SelectItem key={al.value} value={al.value}>{al.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {gradeOptions.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Grade Level
                </label>
                <Select value={form.grade_level || '__none__'} onValueChange={(v) => setForm((prev) => ({ ...prev, grade_level: v === '__none__' ? '' : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select grade level</SelectItem>
                    {gradeOptions.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

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
                ? 'User will receive an email with their temporary password.'
                : 'User will be created without receiving a password email. You can share credentials manually.'}
            </p>
          </div>
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
            Active (user can log in immediately)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <FormActions isLoading={saving} onCancel={() => router.push(backUrl)} submitLabel="Add User" cancelLabel="Cancel" />
        </div>
      </form>
    </div>
  );
}
