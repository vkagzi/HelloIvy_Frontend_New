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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [gradeFilter, setGradeFilter] = useState(initialGrade);
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addGrade, setAddGrade] = useState('');
  const [addSection, setAddSection] = useState('');
  const [addBoard, setAddBoard] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

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

  const handleAddStudent = async (): Promise<void> => {
    if (!schoolId || !addEmail.trim()) return;
    setAddSaving(true);
    setAddError(null);
    try {
      await api(`/api/schools/${schoolId}/students/`, {
        method: 'POST',
        body: {
          email: addEmail.trim(),
          first_name: addFirstName.trim(),
          last_name: addLastName.trim(),
          grade: addGrade,
          section: addSection.trim(),
          board: addBoard.trim(),
        },
      });
      setAddOpen(false);
      setAddEmail('');
      setAddFirstName('');
      setAddLastName('');
      setAddGrade('');
      setAddSection('');
      setAddBoard('');
      fetchStudents();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add student');
    } finally {
      setAddSaving(false);
    }
  };

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
            asChild
            variant="outline"
          >
            <Link href="/school/users/bulk-import">
              Bulk Import
            </Link>
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
          >
            + Add Student
          </Button>
          <Select value={gradeFilter || '__all__'} onValueChange={(v) => { setGradeFilter(v === '__all__' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Grades</SelectItem>
              {grades.map((g) => (
                <SelectItem key={g} value={g}>Grade {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      pagination={{
        page,
        totalPages,
        onPageChange: setPage,
      }}
    />

      {/* Add Student Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Add Student</h3>
            {addError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {addError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                <Input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="student@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
                  <Input
                    type="text"
                    value={addFirstName}
                    onChange={(e) => setAddFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
                  <Input
                    type="text"
                    value={addLastName}
                    onChange={(e) => setAddLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Grade</label>
                  <Select value={addGrade || '__none__'} onValueChange={(v) => setAddGrade(v === '__none__' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select</SelectItem>
                      {grades.map((g) => (
                        <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Section</label>
                  <Input
                    type="text"
                    value={addSection}
                    onChange={(e) => setAddSection(e.target.value)}
                    placeholder="e.g., A"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Board</label>
                  <Input
                    type="text"
                    value={addBoard}
                    onChange={(e) => setAddBoard(e.target.value)}
                    placeholder="e.g., CBSE"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => { setAddOpen(false); setAddError(null); }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStudent}
                  disabled={addSaving || !addEmail.trim()}
                >
                  {addSaving ? 'Adding...' : 'Add Student'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
