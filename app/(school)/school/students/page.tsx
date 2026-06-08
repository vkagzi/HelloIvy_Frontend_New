'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import { StatusBadge } from '@/components/admin/UserTable';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import AssignModulesDialog from '@/components/AssignModulesDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';
import { useModuleChoices, buildModuleLookups } from '@/lib/hooks/useModuleChoices';

interface ModuleAssignment {
  id: number;
  module_name: string;
}

interface StudentItem {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  grade: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  assigned_modules?: ModuleAssignment[];
}

export default function SchoolStudentsPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const schoolId = session?.user?.school_id;
  const initialGrade = searchParams?.get('grade') ?? '';

  const { modules: moduleChoices } = useModuleChoices();
  const { labels: MODULE_LABELS, colors: MODULE_COLORS } = buildModuleLookups(moduleChoices);

  const [groupedStudents, setGroupedStudents] = useState<Record<string, StudentItem[]>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [autoAssignGrades, setAutoAssignGrades] = useState<string[]>([]);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Assign dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignMode, setAssignMode] = useState<'selected' | 'grade'>('selected');

  // Reminder state
  const [sendingReminder, setSendingReminder] = useState(false);

  // Revoke state
  const [revoking, setRevoking] = useState<number | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{
    id: number;
    moduleName: string;
  } | null>(null);

  // Filter state
  const [nameQuery, setNameQuery] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const fetchStudents = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ group_by: 'grade' });
      if (moduleFilter) params.append('module', moduleFilter);

      const data = await api<{
        grouped_students?: Record<string, StudentItem[]>;
        total: number;
        auto_assign_grades?: string[];
      }>(`/api/schools/${schoolId}/students/?${params.toString()}`);

      const grouped = data.grouped_students ?? {};
      setGroupedStudents(grouped);
      setTotal(data.total);
      setAutoAssignGrades(data.auto_assign_grades ?? []);

      const gradeKeys = Object.keys(grouped).sort((a, b) => {
        if (a === 'No Grade') return 1;
        if (b === 'No Grade') return -1;
        return a.localeCompare(b, undefined, { numeric: true });
      });

      if (gradeKeys.length > 0) {
        setActiveTab((prev) => {
          if (prev && (prev === 'all' || gradeKeys.includes(prev))) return prev;
          if (initialGrade && gradeKeys.includes(initialGrade)) return initialGrade;
          return 'all';
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

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  const allStudents = Object.values(groupedStudents).flat();

  const filterStudents = useCallback((students: StudentItem[]) => {
    let result = students;
    if (nameQuery.trim()) {
      const q = nameQuery.trim().toLowerCase();
      result = result.filter((s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }
    if (emailQuery.trim()) {
      const q = emailQuery.trim().toLowerCase();
      result = result.filter((s) => s.email.toLowerCase().includes(q));
    }
    if (moduleFilter) {
      result = result.filter((s) =>
        (s.assigned_modules ?? []).some((m) => m.module_name === moduleFilter)
      );
    }
    return result;
  }, [nameQuery, emailQuery, moduleFilter]);

  const filteredAllStudents = useMemo(() => filterStudents(allStudents), [filterStudents, allStudents]);
  const filteredGrouped = useMemo(() => {
    const out: Record<string, StudentItem[]> = {};
    for (const grade of Object.keys(groupedStudents)) {
      out[grade] = filterStudents(groupedStudents[grade] ?? []);
    }
    return out;
  }, [filterStudents, groupedStudents]);

  const currentStudents = activeTab === 'all' ? filteredAllStudents : (filteredGrouped[activeTab] ?? []);

  const hasActiveFilters = nameQuery.trim() !== '' || emailQuery.trim() !== '' || moduleFilter !== '';

  const toggleStudent = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (currentStudents.length > 0 && currentStudents.every((s) => selectedIds.has(s.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentStudents.map((s) => s.id)));
    }
  };

  const handleAssignSelected = () => {
    setAssignMode('selected');
    setAssignDialogOpen(true);
  };

  const handleAssignGrade = () => {
    setAssignMode('grade');
    setAssignDialogOpen(true);
  };

  const handleSendReminder = async () => {
    if (selectedIds.size === 0) return;
    setSendingReminder(true);
    try {
      await api('/api/accounts/school/module-reminder/', {
        method: 'POST',
        body: { user_ids: Array.from(selectedIds) },
      });
      setSelectedIds(new Set());
    } catch {
      // ignore
    } finally {
      setSendingReminder(false);
    }
  };

  const handleRevoke = async (assignmentId: number) => {
    setRevoking(assignmentId);
    try {
      await api(`/api/accounts/school/assign-modules/${assignmentId}/revoke/`, {
        method: 'POST',
      });
      fetchStudents();
    } catch {
      // ignore
    } finally {
      setRevoking(null);
      setRevokeTarget(null);
    }
  };

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
          <p className="text-sm text-gray-500">{filteredAllStudents.length} total students</p>
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name…"
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          className="h-9 w-52"
        />
        <Input
          placeholder="Search by email…"
          value={emailQuery}
          onChange={(e) => setEmailQuery(e.target.value)}
          className="h-9 w-56"
        />
        <Select value={moduleFilter || '__all__'} onValueChange={(v: string) => setModuleFilter(v === '__all__' ? '' : v)}>
          <SelectTrigger className="h-9 w-52">
            <SelectValue placeholder="Filter by module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Modules</SelectItem>
            {moduleChoices.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setNameQuery(''); setEmailQuery(''); setModuleFilter(''); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Assignment toolbar */}
      {(selectedIds.size > 0 || currentStudents.length > 0) && (
        <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5">
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm font-medium text-purple-800">
                {selectedIds.size} student{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <Button
                size="xs"
                variant='outline'
                onClick={handleAssignSelected}
              >
                Assign Modules
              </Button>
              <Button
                size="xs"
                variant='outline'
                onClick={handleSendReminder}
                disabled={sendingReminder}
              >
                {sendingReminder ? 'Sending...' : 'Send Reminder'}
              </Button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-purple-600 hover:text-purple-800 underline"
              >
                Clear selection
              </button>
            </>
          )}
          {selectedIds.size === 0 && activeTab && activeTab !== 'No Grade' && activeTab !== 'all' && (
            <Button
              size="xs"
              variant="outline"
              onClick={handleAssignGrade}
            >
              Assign Modules to All in {activeTab}
            </Button>
          )}
        </div>
      )}

      {sortedGrades.length === 0 ? (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">No students found.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto overflow-x-auto">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 data-[state=active]:shadow-none px-5 py-3 whitespace-nowrap"
            >
              All Students
              <span className="ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                {filteredAllStudents.length}
              </span>
            </TabsTrigger>
            {sortedGrades.map((grade) => {
              const count = groupedStudents[grade]?.length ?? 0;
              const hasAutoAssign = autoAssignGrades.includes(grade);
              return (
                <TabsTrigger
                  key={grade}
                  value={grade}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 data-[state=active]:shadow-none px-5 py-3 whitespace-nowrap"
                >
                  {grade}
                  <span className="ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                    {filteredGrouped[grade]?.length ?? 0}
                  </span>
                  {hasAutoAssign && (
                    <span className="ml-1 inline-flex h-4 items-center rounded-full bg-green-100 px-1.5 text-[10px] font-medium text-green-700" title="Auto-assign active">
                      Auto
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredAllStudents.length > 0 && filteredAllStudents.every((s) => selectedIds.has(s.id))}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAllStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      {hasActiveFilters ? 'No students match the current filters.' : 'No students found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAllStudents.map((s) => (
                    <TableRow key={s.id} className={selectedIds.has(s.id) ? 'bg-purple-50/50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(s.id)}
                          onCheckedChange={() => toggleStudent(s.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/school/students/${s.id}`}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          {s.first_name || s.last_name ? `${s.first_name} ${s.last_name}`.trim() : s.email}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.email}</TableCell>
                      <TableCell>{s.grade || 'No Grade'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {(s.assigned_modules ?? []).map((m) => (
                            <TooltipProvider key={m.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Badge
                                      className={`group/badge cursor-pointer gap-1 pr-1.5 transition-all ${MODULE_COLORS[m.module_name] ?? 'bg-gray-100 text-gray-700'} border-transparent hover:shadow-sm ${revoking === m.id ? 'opacity-50' : ''}`}
                                      onClick={() =>
                                        setRevokeTarget({
                                          id: m.id,
                                          moduleName: m.module_name,
                                        })
                                      }
                                    >
                                      {MODULE_LABELS[m.module_name] ?? m.module_name}
                                      <svg
                                        className="size-3 opacity-0 transition-opacity group-hover/badge:opacity-70"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </Badge>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  Click to revoke access
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                          {(!s.assigned_modules || s.assigned_modules.length === 0) && (
                            <span className="text-xs text-muted-foreground italic">None</span>
                          )}
                        </div>
                      </TableCell>
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

          {sortedGrades.map((grade) => {
            const students = filteredGrouped[grade] ?? [];
            const allSelected = students.length > 0 && students.every((s) => selectedIds.has(s.id));
            return (
              <TabsContent key={grade} value={grade} className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Modules</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          {hasActiveFilters ? 'No students match the current filters.' : 'No students in this grade.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((s) => (
                        <TableRow key={s.id} className={selectedIds.has(s.id) ? 'bg-purple-50/50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(s.id)}
                              onCheckedChange={() => toggleStudent(s.id)}
                            />
                          </TableCell>
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
                            <div className="flex flex-wrap gap-1.5">
                              {(s.assigned_modules ?? []).map((m) => (
                                <TooltipProvider key={m.id}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Badge
                                          className={`group/badge cursor-pointer gap-1 pr-1.5 transition-all ${MODULE_COLORS[m.module_name] ?? 'bg-gray-100 text-gray-700'} border-transparent hover:shadow-sm ${revoking === m.id ? 'opacity-50' : ''}`}
                                          onClick={() =>
                                            setRevokeTarget({
                                              id: m.id,
                                              moduleName: m.module_name,
                                            })
                                          }
                                        >
                                          {MODULE_LABELS[m.module_name] ?? m.module_name}
                                          <svg
                                            className="size-3 opacity-0 transition-opacity group-hover/badge:opacity-70"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12"
                                            />
                                          </svg>
                                        </Badge>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      Click to revoke access
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                              {(!s.assigned_modules || s.assigned_modules.length === 0) && (
                                <span className="text-xs text-muted-foreground italic">None</span>
                              )}
                            </div>
                          </TableCell>
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

      {/* Assign modules dialog */}
      <AssignModulesDialog
        open={assignDialogOpen}
        onOpenChange={(isOpen) => {
          setAssignDialogOpen(isOpen);
        }}
        selectedStudentIds={assignMode === 'selected' ? Array.from(selectedIds) : []}
        gradeLevel={assignMode === 'grade' ? activeTab : undefined}
        studentCount={assignMode === 'selected' ? selectedIds.size : currentStudents.length}
        schoolId={schoolId}
        onSuccess={() => {
          setSelectedIds(new Set());
          fetchStudents();
        }}
      />

      {/* Revoke confirmation dialog */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Module Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke{' '}
              <span className="font-medium text-foreground">
                {revokeTarget
                  ? (MODULE_LABELS[revokeTarget.moduleName] ??
                    revokeTarget.moduleName)
                  : ''}
              </span>{' '}
              access? The student will lose access to this module immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={revoking !== null}
              onClick={() => {
                if (revokeTarget) handleRevoke(revokeTarget.id);
              }}
            >
              {revoking !== null ? 'Revoking...' : 'Revoke Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
