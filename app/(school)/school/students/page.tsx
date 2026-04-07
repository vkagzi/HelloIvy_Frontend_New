'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import UserTable, { StatusBadge, Column } from '@/components/admin/UserTable';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';

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
  const [groupedStudents, setGroupedStudents] = useState<Record<string, StudentItem[]>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [gradeFilter, setGradeFilter] = useState(initialGrade);
  const [isGrouped, setIsGrouped] = useState(false);

  const fetchStudents = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (gradeFilter) params.set('grade', gradeFilter);
      if (isGrouped) params.set('group_by', 'grade');

      const data = await api<{
        students?: StudentItem[];
        grouped_students?: Record<string, StudentItem[]>;
        total: number;
        page?: number;
        page_size?: number;
      }>(`/api/schools/${schoolId}/students/?${params.toString()}`);
      
      if (isGrouped && data.grouped_students) {
        setGroupedStudents(data.grouped_students);
        setStudents([]);
      } else if (data.students) {
        setStudents(data.students);
        setGroupedStudents({});
      }
      setTotal(data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [schoolId, page, pageSize, gradeFilter, isGrouped]);

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
    <>
      {isGrouped ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Students</h1>
              <p className="text-sm text-gray-500">{total} total students</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isGrouped ? "default" : "outline"}
                onClick={() => setIsGrouped(!isGrouped)}
                className="text-sm"
              >
                {isGrouped ? 'Grouped View' : 'List View'}
              </Button>
              <Button asChild variant="outline">
                <Link href="/school/users/bulk-import">Bulk Import</Link>
              </Button>
              <Button asChild>
                <Link href="/school/students/create">+ Add Student</Link>
              </Button>
            </div>
          </div>

          {Object.entries(groupedStudents).length > 0 ? (
            Object.entries(groupedStudents).map(([grade, gradeStudents]) => (
              <div key={grade} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {grade} ({gradeStudents.length} students)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Section</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Board</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Last Login</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {gradeStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/school/students/${s.id}`}
                              className="font-medium text-purple-600 hover:text-purple-800"
                            >
                              {s.first_name || s.last_name ? `${s.first_name} ${s.last_name}`.trim() : s.email}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.section || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.board || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge active={s.is_active} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {s.last_login ? new Date(s.last_login).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/school/students/${s.id}`}
                              className="inline-flex rounded-md bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-100"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-md bg-yellow-50 p-4">
              <p className="text-sm text-yellow-700">No students found.</p>
            </div>
          )}
        </div>
      ) : (
        <>
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
              <div className="flex items-center gap-2">
                <Button
                  variant={isGrouped ? "default" : "outline"}
                  onClick={() => setIsGrouped(!isGrouped)}
                  className="text-sm"
                >
                  {isGrouped ? 'Grouped View' : 'List View'}
                </Button>
                <Button
                  asChild
                  variant="outline"
                >
                  <Link href="/school/users/bulk-import">
                    Bulk Import
                  </Link>
                </Button>
                <Button
                  asChild
                >
                  <Link href="/school/students/create">
                    + Add Student
                  </Link>
                </Button>
              </div>
            }
            pagination={{
              page,
              totalPages,
              onPageChange: setPage,
            }}
          />
        </>
      )}
    </>
  );
}
