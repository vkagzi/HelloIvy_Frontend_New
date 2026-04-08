'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '@/lib/api-client';
import { useToast } from '@/app/_components/Toast';
import { extractApiError } from '@/lib/utils/api-error';
import { PageHeader } from '@/components/form/PageHeader';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import EditUserForm, { type EditUserFormValues } from '@/components/admin/EditUserForm';

interface OpsAdminDetail {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
}

export default function EditOpsAdminPage() {
  const params = useParams();
  const router = useRouter();
  const opsAdminId = params?.id;
  const { data: session, status } = useSession();
  const { addToast } = useToast();

  // Redirect schoolopsadmin away from this page
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'schoolopsadmin') {
      router.replace('/school/dashboard');
    }
  }, [session, status, router]);

  const [opsAdmin, setOpsAdmin] = useState<OpsAdminDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!opsAdminId) return;
    const fetchOpsAdmin = async () => {
      try {
        const data = await api<OpsAdminDetail>(
          `/api/schools/operations-admin/${opsAdminId}/`
        );
        setOpsAdmin(data);
      } catch (err: unknown) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load operations admin');
      } finally {
        setLoading(false);
      }
    };
    fetchOpsAdmin();
  }, [opsAdminId]);

  const handleSubmit = async (values: EditUserFormValues) => {
    setSaveError(null);
    setSaving(true);
    try {
      await api(`/api/schools/operations-admin/${opsAdminId}/`, {
        method: 'PATCH',
        body: {
          first_name: values.first_name,
          last_name: values.last_name,
        },
      });
      addToast('Operations admin updated successfully', { type: 'success' });
      router.push(`/school/operations-admin/${opsAdminId}`);
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update operations admin');
      setSaveError(message);
      addToast(message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading operations admin details..." />;
  if (loadError || !opsAdmin) return <ErrorState message={loadError || 'Operations admin not found'} />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        backUrl={`/school/operations-admin/${opsAdminId}`}
        title="Edit Operations Admin"
      />
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-5">
        <EditUserForm
          email={opsAdmin.email}
          initialValues={{
            first_name: opsAdmin.first_name ?? '',
            last_name: opsAdmin.last_name ?? '',
            is_active: opsAdmin.is_active,
          }}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/school/operations-admin/${opsAdminId}`)}
          saving={saving}
          error={saveError}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
