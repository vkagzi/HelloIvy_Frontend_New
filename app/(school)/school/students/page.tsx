'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import { StatusBadge } from '@/components/admin/UserTable';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { Button } from '@/components/ui/button';

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

export default function SchoolStudentsPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const schoolId = session?.user?.school_id;
  const initialGrade = searchParams?.get('grade') ?? '';

  const [groupedStudents, setGroupedStudents] = useState<Record<string, StudentItem[]>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  const fetchStudents = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ group_by: 'grade' });

      const data = await api<{
        grouped_students?: Record<string, StudentItem[]>;
        total: number;
      }>(`/api/schools/${schoolId}/students/?${params.toString()}`);

      const grouped = data.grouped_students ?? {};
      setGroupedStudents(grouped);
      setTotal(data.total);

      // Set initial active tab
      const gradeKeys = Object.keys(grouped).sort((a, b) => {
        if (a === 'No Grade') return 1;
        if (b === 'No Grade') return -1;
        return a.localeCompare(b, undefined, { numeric: true });
      });

      if (gradeKeys.length > 0) {
        setActiveTab((prev) => {
          if (prev && gradeKeys.includes(prev)) return prev;
          if (initialGrade && gradeKeys.includes(initialGrade)) return initialGrade;
          return gradeKeys[0];
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [schoolId, initialGrade]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

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

  const sortedGrades = Object.keys(groupedStudents).sort((a, b) => {
    if (a === 'No Grade') return 1;
    if (b === 'No Grade') return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  const activeStudents = activeTab ? (groupedStudents[activeTab] ?? []) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500">{total} total students</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="">
            <Link href="/school/users/bulk-import">Bulk Import</Link>
          </Button>
          <Button asChild className="">
            <Link href="/school/students/create">+ Add Student</Link>
          </Button>
        </div>
      </div>

      {sortedGrades.length === 0 ? (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">No students found.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          {/* Grade Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {sortedGrades.map((grade) => {
              const count = groupedStudents[grade]?.length ?? 0;
              const isActive = activeTab === grade;
              return (
                <button
                  key={grade}
                  onClick={() => setActiveTab(grade)}
                  className={`flex items-center gap-2 whitespace-nowrap px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-purple-600 text-purple-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {grade}
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isActive
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Students Table */}
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
                {activeStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                      No students in this grade.
                    </td>
                  </tr>
                ) : (
                  activeStudents.map((s) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
