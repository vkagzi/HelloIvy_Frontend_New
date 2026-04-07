'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '@/lib/api-client';
import { formatDate, formatDateTime } from '@/lib/utils/date-formatter';
import UserTable, { RoleBadge, StatusBadge, Column } from '@/components/admin/UserTable';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { ADMIN_ROLES, ROLE_FILTER_OPTIONS, type RoleValue } from '@/lib/constants/roles';

interface UserItem {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: RoleValue;
  is_active: boolean;
  terms_accepted: boolean;
  school_id: number | null;
  school_name: string | null;
  academic_level: string | null;
  grade_level: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

const ROLE_OPTIONS = ROLE_FILTER_OPTIONS;

/** Ordered from highest to lowest privilege */
const ROLE_TIER: string[] = ['superadmin', 'operationadmin', 'schooladmin', 'schoolopsadmin', 'student'];

/** Roles that may see the user-type filter at all */
const ROLES_WITH_TYPE_FILTER = ['superadmin', 'operationadmin', 'schooladmin'];

/** Roles that may see the school filter */
const ROLES_WITH_SCHOOL_FILTER = ['superadmin', 'operationadmin'];

const ACADEMIC_LEVEL_LABELS: Record<string, string> = {
  high_school: 'High School (9th–12th grade)',
  undergraduate: 'College/Undergraduate',
  postgraduate: "Postgraduate/Master's",
  professional: 'Working Professional',
};

const columns: Column<UserItem>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (u) => {
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ');
      return (
        <Link href={`/admin/users/${u.id}`} className="font-medium text-purple-600 hover:text-purple-800">
          {name || u.email}
        </Link>
      );
    },
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    render: (u) => <span className="text-gray-900">{u.email}</span>,
  },
  {
    key: 'role',
    label: 'Role',
    sortable: true,
    render: (u) => <RoleBadge role={u.role} />,
  },
  {
    key: 'school',
    label: 'School',
    sortable: true,
    render: (u) => <span className="text-gray-500">{u.school_name || '—'}</span>,
  },
  {
    key: 'academic_level',
    label: 'Academic Level',
    sortable: true,
    render: (u) => <span className="text-gray-500">{(u.academic_level && ACADEMIC_LEVEL_LABELS[u.academic_level]) || '—'}</span>,
  },
  {
    key: 'grade_level',
    label: 'Grade Level',
    sortable: true,
    render: (u) => <span className="text-gray-500">{u.grade_level || '—'}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (u) => <StatusBadge active={u.is_active} />,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    render: (u) => <span className="text-gray-500">{formatDate(u.created_at)}</span>,
  },
  {
    key: 'last_login',
    label: 'Last Login',
    sortable: true,
    render: (u) => (
      <span className="text-gray-500">{u.last_login ? formatDateTime(u.last_login) : 'Never'}</span>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (u) => (
      <Link
        href={`/admin/users/${u.id}`}
        className="inline-flex cursor-pointer rounded-md bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-100"
      >
        View Details
      </Link>
    ),
  },
];

const TYPE_CONFIG: Record<string, { title: string; label: string; filter: (u: UserItem) => boolean }> = {
  b2c: {
    title: 'B2C Users',
    label: 'B2C users',
    filter: (u) => u.school_id === null,
  },
  schoolusers: {
    title: 'School Users',
    label: 'school users',
    filter: (u) => u.school_id !== null,
  },
  admin: {
    title: 'Admin Users',
    label: 'admin users',
    filter: (u) => ADMIN_ROLES.includes(u.role),
  },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const typeParam = searchParams?.get('type') ?? null;
  const typeConfig = typeParam ? TYPE_CONFIG[typeParam] : null;
  const { data: session } = useSession();
  const currentRole = session?.user?.role ?? '';

  // Role options: only shown for superadmin, operationadmin, schooladmin
  // Options are limited to roles with a lower tier than the current user
  const roleFilterOptions = useMemo(() => {
    if (!ROLES_WITH_TYPE_FILTER.includes(currentRole)) return [];
    const currentTierIndex = ROLE_TIER.indexOf(currentRole);
    if (currentTierIndex === -1) return [];
    const lowerTierRoles = ROLE_TIER.slice(currentTierIndex + 1);
    return ROLE_OPTIONS.filter((o) => lowerTierRoles.includes(o.value));
  }, [currentRole]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api<{ users: UserItem[] }>(
          '/api/accounts/admin/users/'
        );
        setUsers(data.users);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!typeConfig) return users;
    return users.filter(typeConfig.filter);
  }, [users, typeConfig]);

  const title = typeConfig?.title ?? 'Users';
  const totalLabel = typeConfig
    ? `${filteredUsers.length} ${typeConfig.label}`
    : `${filteredUsers.length} total users`;

  if (loading) return <LoadingState message="Loading users..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <UserTable
      data={filteredUsers}
      columns={columns}
      title={title}
      totalLabel={totalLabel}
      filters={{
        showNameSearch: true,
        showEmailSearch: true,
        roleOptions: roleFilterOptions,
        schoolOptions: ROLES_WITH_SCHOOL_FILTER.includes(currentRole)
          ? (() => {
              const schools = new Map<string, string>();
              for (const u of users) {
                if (u.school_id != null && u.school_name) {
                  schools.set(String(u.school_id), u.school_name);
                }
              }
              return Array.from(schools, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
            })()
          : [],
      }}
      getNameValue={(u) => [u.first_name, u.last_name, u.email].filter(Boolean).join(' ')}
      getRoleValue={(u) => u.role}
      getSchoolValue={(u) => u.school_id != null ? String(u.school_id) : ''}
      getSortValue={(u, key) => {
        switch (key) {
          case 'name': return [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase() || u.email.toLowerCase();
          case 'email': return u.email.toLowerCase();
          case 'role': return u.role;
          case 'school': return u.school_name?.toLowerCase() ?? '';
          case 'academic_level': return u.academic_level?.toLowerCase() ?? '';
          case 'grade_level': return u.grade_level?.toLowerCase() ?? '';
          case 'status': return u.is_active ? 'active' : 'inactive';
          case 'created_at': return u.created_at;
          case 'last_login': return u.last_login ?? '';
          default: return null;
        }
      }}
      headerRight={
        <div className="flex gap-2">
          {typeParam === 'schoolusers' && session?.user?.role !== 'operationadmin' && (
            <Link
              href="/admin/users/bulk-import"
              className="cursor-pointer rounded-md border border-purple-600 px-4 py-2 text-sm font-medium text-purple-600 transition hover:bg-purple-50"
            >
              Bulk Import
            </Link>
          )}
          {session?.user?.role !== 'operationadmin' && (
            <Link
              href={`/admin/users/create${typeParam ? `?type=${typeParam}` : ''}`}
              className="cursor-pointer rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
            >
              Add User
            </Link>
          )}
        </div>
      }
    />
  );
}
