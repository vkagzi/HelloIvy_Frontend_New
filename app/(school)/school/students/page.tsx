'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import UserTable, { StatusBadge, Column } from '@/components/admin/UserTable';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';

interface StudentItem {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  grade: string;
  section: string;
  board: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

const columns: Column<StudentItem>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (s) => (
      <Link href={`/school/students/${s.id}`} className="font-medium text-purple-600 hover:text-purple-800">
        {s.first_name || s.last_name ? `${s.first_name} ${s.last_name}`.trim() : s.email}
      </Link>
    ),
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    render: (s) => <span className="text-gray-500">{s.email}</span>,
  },
  {
    key: 'grade',
    label: 'Grade',
    sortable: true,
    render: (s) => <span className="text-gray-500">{s.grade || '-'}</span>,
  },
  {
    key: 'section',
    label: 'Section',
    sortable: true,
    render: (s) => <span className="text-gray-500">{s.section || '-'}</span>,
  },
  {
    key: 'board',
    label: 'Board',
    sortable: true,
    render: (s) => <span className="text-gray-500">{s.board || '-'}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (s) => <StatusBadge active={s.is_active} />,
  },
  {
    key: 'last_login',
    label: 'Last Login',
    sortable: true,
    render: (s) => (
      <span className="text-gray-500">{s.last_login ? new Date(s.last_login).toLocaleString() : 'Never'}</span>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (s) => (
      <Link
        href={`/school/students/${s.id}`}
        className="inline-flex rounded-md bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-100"
      >
        View Details
      </Link>
    ),
  },
];

export default function SchoolStudentsPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const schoolId = session?.user?.school_id;
  const initialGrade = searchParams?.get('grade') ?? '';

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [gradeFilter, setGradeFilter] = useState(initialGrade);

  const fetchStudents = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (gradeFilter) params.set('grade', gradeFilter);

      const data = await api<{
        students: StudentItem[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/schools/${schoolId}/students/?${params.toString()}`);
      setStudents(data.students);
      setTotal(data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [schoolId, page, pageSize, gradeFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const totalPages = Math.ceil(total / pageSize);
  const grades = ['8', '9', '10', '11', '12'];

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

  if (loading) return <LoadingState message="Loading students..." />;

  if (error) return <ErrorState message={error} />;

  return (
    <UserTable
      data={students}
      columns={columns}
      title="Students"
      totalLabel={`${total} total students`}
      filters={{
        showNameSearch: true,
        showEmailSearch: true,
        roleOptions: grades.map((g) => ({ value: g, label: `Grade ${g}` })),
      }}
      getNameValue={(s) => [s.first_name, s.last_name, s.email].filter(Boolean).join(' ')}
      getRoleValue={(s) => s.grade}
      getSortValue={(s, key) => {
        switch (key) {
          case 'name': return [s.first_name, s.last_name].filter(Boolean).join(' ').toLowerCase() || s.email.toLowerCase();
          case 'email': return s.email.toLowerCase();
          case 'grade': return s.grade || '';
          case 'section': return s.section || '';
          case 'board': return s.board || '';
          case 'status': return s.is_active ? 'active' : 'inactive';
          case 'last_login': return s.last_login ?? '';
          default: return null;
        }
      }}
      headerRight={
        <select
          value={gradeFilter}
          onChange={(e) => {
            setGradeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All Grades</option>
          {grades.map((g) => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </select>
      }
      pagination={{
        page,
        totalPages,
        onPageChange: setPage,
      }}
    />
  );
}
