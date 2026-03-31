'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api-client';
import UserTable, { RoleBadge, StatusBadge, Column } from '@/components/admin/UserTable';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';

interface UserItem {
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
}

const ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'operationadmin', label: 'Operation Admin' },
  { value: 'schooladmin', label: 'School Admin' },
  { value: 'student', label: 'Student' },
];

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
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (u) => <StatusBadge active={u.is_active} />,
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    render: (u) => <span className="text-gray-500">{new Date(u.created_at).toLocaleDateString()}</span>,
  },
  {
    key: 'last_login',
    label: 'Last Login',
    sortable: true,
    render: (u) => (
      <span className="text-gray-500">{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</span>
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

const ADMIN_ROLES = ['superadmin', 'operationadmin', 'schooladmin'];

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
        roleOptions: ROLE_OPTIONS,
        schoolOptions: (() => {
          const schools = new Map<string, string>();
          for (const u of users) {
            if (u.school_id != null && u.school_name) {
              schools.set(String(u.school_id), u.school_name);
            }
          }
          return Array.from(schools, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
        })(),
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
          case 'status': return u.is_active ? 'active' : 'inactive';
          case 'created_at': return u.created_at;
          case 'last_login': return u.last_login ?? '';
          default: return null;
        }
      }}
      headerRight={
        <Link
          href="/admin/users/create"
          className="cursor-pointer rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
        >
          Add User
        </Link>
      }
    />
  );
}
