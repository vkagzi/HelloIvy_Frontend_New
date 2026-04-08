'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import { StatusBadge } from '@/components/admin/UserTable';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StudentItem {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  grade: string;
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto overflow-x-auto">
            {sortedGrades.map((grade) => {
              const count = groupedStudents[grade]?.length ?? 0;
              return (
                <TabsTrigger
                  key={grade}
                  value={grade}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 data-[state=active]:shadow-none px-5 py-3 whitespace-nowrap"
                >
                  {grade}
                  <span className="ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                    {count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {sortedGrades.map((grade) => {
            const students = groupedStudents[grade] ?? [];
            return (
              <TabsContent key={grade} value={grade} className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                          No students in this grade.
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/school/students/${s.id}`}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              {s.first_name || s.last_name ? `${s.first_name} ${s.last_name}`.trim() : s.email}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{s.email}</TableCell>
                          <TableCell>
                            <StatusBadge active={s.is_active} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {s.last_login ? new Date(s.last_login).toLocaleString() : 'Never'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            );
          })}
        </Tabs>
        </div>
      )}
    </div>
  );
}
