'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import UserTable, { StatusBadge, Column } from '@/components/admin/UserTable';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { Button } from '@/components/ui/button';

interface OpsAdminItem {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

const columns: Column<OpsAdminItem>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (admin) => (
      <Link href={`/school/operations-admin/${admin.id}`} className="font-medium text-purple-600 hover:text-purple-800">
        {admin.first_name || admin.last_name ? `${admin.first_name} ${admin.last_name}`.trim() : admin.email}
      </Link>
    ),
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    render: (admin) => <span className="text-gray-500">{admin.email}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (admin) => <StatusBadge active={admin.is_active} />,
  },
  {
    key: 'last_login',
    label: 'Last Login',
    sortable: true,
    render: (admin) => (
      <span className="text-gray-500">{admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}</span>
    ),
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    render: (admin) => (
      <span className="text-gray-500">{new Date(admin.created_at).toLocaleDateString()}</span>
    ),
  },
];

export default function SchoolOpsAdminsPage() {
  const { data: session, status } = useSession();
  const schoolId = session?.user?.school_id;
  const router = useRouter();

  // Redirect schoolopsadmin away from this page
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'schoolopsadmin') {
      router.replace('/school/dashboard');
    }
  }, [session, status, router]);

  const [opsAdmins, setOpsAdmins] = useState<OpsAdminItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpsAdmins = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await api<{
        ops_admins: OpsAdminItem[];
        total: number;
      }>(`/api/schools/${schoolId}/ops-admins/`);
      
      setOpsAdmins(data.ops_admins);
      setTotal(data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load operations admins');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchOpsAdmins();
  }, [fetchOpsAdmins]);

  if (status === 'loading') return <LoadingState />;

  if (!schoolId) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-700">
          No school is associated with your account. Please contact an administrator.
        </p>
      </div>
    );
  }

  if (loading) return <LoadingState message="Loading operations admins..." />;

  if (error) return <ErrorState message={error} />;

  return (
    <UserTable
      data={opsAdmins}
      columns={columns}
      title="Operations Admin"
      totalLabel={`${total} total operations admins`}
      filters={{
        showNameSearch: true,
        showEmailSearch: true,
      }}
      getNameValue={(admin) => [admin.first_name, admin.last_name, admin.email].filter(Boolean).join(' ')}
      getSortValue={(admin, key) => {
        switch (key) {
          case 'name': return [admin.first_name, admin.last_name].filter(Boolean).join(' ').toLowerCase() || admin.email.toLowerCase();
          case 'email': return admin.email.toLowerCase();
          case 'status': return admin.is_active ? 'active' : 'inactive';
          case 'last_login': return admin.last_login ?? '';
          case 'created_at': return admin.created_at;
          default: return null;
        }
      }}
      headerRight={
        <Button asChild>
          <Link href="/school/operations-admin/create">
            + Add Operations Admin
          </Link>
        </Button>
      }
    />
  );
}
