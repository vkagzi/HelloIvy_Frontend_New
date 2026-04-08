'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import { useToast } from '@/app/_components/Toast';
import { extractApiError } from '@/lib/utils/api-error';
import { PageHeader } from '@/components/form/PageHeader';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import EditUserForm, { type EditUserFormValues } from '@/components/admin/EditUserForm';

interface StudentDetail {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  academic_level?: string;
  grade_level?: string;
}

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id;
  const { addToast } = useToast();

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchStudent = async () => {
      try {
        const data = await api<StudentDetail>(`/api/accounts/admin/users/${userId}/`);
        setStudent(data);
      } catch (err: unknown) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load student');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [userId]);

  const handleSubmit = async (values: EditUserFormValues) => {
    setSaveError(null);
    setSaving(true);
    try {
      await api(`/api/accounts/admin/users/${userId}/`, {
        method: 'PATCH',
        body: {
          first_name: values.first_name,
          last_name: values.last_name,
          is_active: values.is_active,
          academic_level: 'high_school',
          grade_level: values.grade_level || null,
        },
      });
      addToast('Student updated successfully', { type: 'success' });
      router.push(`/school/students/${userId}`);
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update student');
      setSaveError(message);
      addToast(message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading student details..." />;
  if (loadError || !student) return <ErrorState message={loadError || 'Student not found'} />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        backUrl={`/school/students/${userId}`}
        title="Edit Student"
      />
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-5">
        <EditUserForm
          email={student.email}
          initialValues={{
            first_name: student.first_name ?? '',
            last_name: student.last_name ?? '',
            is_active: student.is_active,
            grade_level: student.grade_level ?? '',
          }}
          fixedAcademicLevel="high_school"
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/school/students/${userId}`)}
          saving={saving}
          error={saveError}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
