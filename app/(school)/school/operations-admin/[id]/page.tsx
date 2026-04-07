'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '@/lib/api-client';
import { formatDate, formatDateTime } from '@/lib/utils/date-formatter';
import UserDetailHeader from '@/components/admin/UserDetailHeader';
import UserPasswordChangeModal from '@/components/admin/UserPasswordChangeModal';
import UserStatusToggleModal from '@/components/admin/UserStatusToggleModal';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { useToast } from '@/app/_components/Toast';
import { extractApiError } from '@/lib/utils/api-error';
import { Button } from '@/components/ui/button';

interface OpsAdminDetail {
  id: number;
  email: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  school_id: number | null;
  school_name: string | null;
}

export default function OpsAdminDetailPage() {
  const params = useParams();
  const opsAdminId = params?.id;
  const { addToast } = useToast();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect schoolopsadmin away from this page
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'schoolopsadmin') {
      router.replace('/school/dashboard');
    }
  }, [session, status, router]);

  const [opsAdmin, setOpsAdmin] = useState<OpsAdminDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Change Password modal state
  const [pwOpen, setPwOpen] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Deactivate modal state
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateSaving, setDeactivateSaving] = useState(false);

  useEffect(() => {
    const fetchOpsAdmin = async () => {
      try {
        const data = await api<OpsAdminDetail>(
          `/api/schools/operations-admin/${opsAdminId}/`
        );
        setOpsAdmin(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch operations admin details');
      } finally {
        setLoading(false);
      }
    };

    if (opsAdminId) {
      fetchOpsAdmin();
    }
  }, [opsAdminId]);

  const handleChangePassword = async (newPassword: string, confirmPassword: string) => {
    setPwError(null);
    setPwSuccess(false);
    setPwSaving(true);
    try {
      await api(`/api/schools/operations-admin/${opsAdminId}/`, {
        method: 'POST',
        body: { new_password: newPassword },
      });
      setPwSuccess(true);
      addToast('Password changed successfully', { type: 'success' });
      setTimeout(() => setPwOpen(false), 1500);
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to change password');
      setPwError(message);
    } finally {
      setPwSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!opsAdmin) return;
    setDeactivateSaving(true);
    try {
      const updated = await api<OpsAdminDetail>(
        `/api/schools/operations-admin/${opsAdmin.id}/`,
        {
          method: 'PUT',
          body: { is_active: !opsAdmin.is_active },
        }
      );
      setOpsAdmin(updated);
      addToast(
        `Operations admin ${updated.is_active ? 'activated' : 'deactivated'} successfully`,
        { type: 'success' }
      );
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update status');
      addToast(message, { type: 'error' });
    } finally {
      setDeactivateSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading operations admin details..." />;
  if (error || !opsAdmin) return <ErrorState message={error || 'Operations admin not found'} />;

  return (
    <div>
      <UserDetailHeader
        backHref="/school/operations-admin"
        backLabel="Back to Operations Admins"
        email={opsAdmin.email}
        isActive={opsAdmin.is_active}
        userId={opsAdmin.id}
        infoFields={[
          { label: 'School', value: opsAdmin.school_name || 'N/A' },
          { label: 'Created', value: formatDate(opsAdmin.created_at) },
          { label: 'Last Login', value: opsAdmin.last_login ? formatDateTime(opsAdmin.last_login) : 'Never' },
        ]}
        actions={
          <>
            <Button
              onClick={() => {
                setPwError(null);
                setPwSuccess(false);
                setPwOpen(true);
              }}
              variant="default"
              className="bg-indigo-600 hover:bg-indigo-700"
              size="sm"
            >
              Change Password
            </Button>
            <Button
              onClick={() => setDeactivateOpen(true)}
              variant={opsAdmin.is_active ? 'destructive' : 'default'}
              className={opsAdmin.is_active ? '' : 'bg-green-600 hover:bg-green-700'}
              size="sm"
            >
              {opsAdmin.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      />

      {/* Change Password Modal */}
      <UserPasswordChangeModal
        open={pwOpen}
        onOpenChange={setPwOpen}
        onSubmit={handleChangePassword}
        loading={pwSaving}
        error={pwError}
        success={pwSuccess}
        minPasswordLength={6}
      />

      {/* Deactivate/Activate Modal */}
      <UserStatusToggleModal
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        onSubmit={handleToggleActive}
        isActive={opsAdmin.is_active}
        loading={deactivateSaving}
        userEmail={opsAdmin.email}
      />
    </div>
  );
}
