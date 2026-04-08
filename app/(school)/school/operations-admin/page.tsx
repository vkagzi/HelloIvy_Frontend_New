'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import { StatusBadge } from '@/components/admin/UserTable';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface OpsAdminItem {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Admins</h1>
          <p className="text-sm text-gray-500">{total} total operations admins</p>
        </div>
        <Button asChild>
          <Link href="/school/operations-admin/create">+ Add Operations Admin</Link>
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opsAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No operations admins found.
                </TableCell>
              </TableRow>
            ) : (
              opsAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/school/operations-admin/${admin.id}`}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      {admin.first_name || admin.last_name
                        ? `${admin.first_name} ${admin.last_name}`.trim()
                        : admin.email}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                  <TableCell>
                    <StatusBadge active={admin.is_active} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

