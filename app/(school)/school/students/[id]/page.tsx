'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import { formatDate, formatDateTime } from '@/lib/utils/date-formatter';
import UserDetailHeader from '@/components/admin/UserDetailHeader';
import ModuleCard from '@/components/admin/ModuleCard';
import type { ModuleStats } from '@/components/admin/ModuleCard';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';

interface UserDetail {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  terms_accepted: boolean;
  school_id: number | null;
  school_name: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  modules: {
    domain_discovery: ModuleStats;
    career_discovery: ModuleStats;
  };
}

export default function SchoolStudentDetailPage() {
  const params = useParams();
  const userId = params?.id;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api<UserDetail>(
          `/api/accounts/admin/users/${userId}/`
        );
        setUser(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch student details');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (loading) return <LoadingState message="Loading student details..." />;
  if (error || !user) return <ErrorState message={error || 'Student not found'} />;

  const studentName =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.first_name || user.last_name || user.email;

  return (
    <div>
      <UserDetailHeader
        backHref="/school/students"
        backLabel="Back to Students"
        email={user.email}
        name={studentName !== user.email ? studentName : undefined}
        isActive={user.is_active}
        infoFields={[
          { label: 'Created', value: formatDate(user.created_at) },
          { label: 'Last Login', value: user.last_login ? formatDateTime(user.last_login) : 'Never' },
          { label: 'School', value: user.school_name || 'N/A' },
        ]}
        actions={
          <Link
            href={`/school/students/${userId}/edit`}
            className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-purple-700"
          >
            Edit Student
          </Link>
        }
      />

      {/* Module Stats Cards */}
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ModuleCard
          title="Stream & Subject Selection"
          module="domain"
          stats={user.modules.domain_discovery}
          studentName={studentName}
        />
        <ModuleCard
          title="Career & Degree Selection"
          module="career"
          stats={user.modules.career_discovery}
          studentName={studentName}
        />
      </div>
    </div>
  );
}
