'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import api from '@/lib/api-client';
import { FiIcon } from '@/app/_components/Icons';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/_components/Select';

interface ModuleInfo {
  module_name: string;
  module_display: string;
  students_using: number;
  max_students: number | null;
  expiry_date: string | null;
  is_active: boolean;
}

interface GradeInfo {
  grade: string;
  student_count: number;
  domain_discovery_count: number;
  career_discovery_count: number;
  college_selector_count: number;
}

interface DashboardData {
  school: { id: number; name: string; logo_url: string | null };
  total_students: number;
  active_students: number;
  modules: ModuleInfo[];
  grade_overview: GradeInfo[];
}

interface DeadlineItem {
  id: number;
  title: string;
  date: string;
  time: string | null;
  target_grade: string;
  created_by_email: string;
  created_at: string;
}

export default function SchoolDashboardPage() {
  const { data: session, status } = useSession();
  const schoolId = session?.user?.school_id;
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notification modal state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifGrade, setNotifGrade] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSending, setNotifSending] = useState(false);

  // Deadline modal state
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [dlTitle, setDlTitle] = useState('');
  const [dlDate, setDlDate] = useState('');
  const [dlTime, setDlTime] = useState('');
  const [dlGrade, setDlGrade] = useState('');
  const [dlSaving, setDlSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [dashData, dlData] = await Promise.all([
        api<DashboardData>(`/api/schools/${schoolId}/dashboard/`),
        api<{ deadlines: DeadlineItem[] }>(`/api/schools/${schoolId}/deadlines/`),
      ]);
      setDashboard(dashData);
      setDeadlines(dlData.deadlines);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendNotification = async () => {
    if (!schoolId || !notifMessage.trim()) return;
    setNotifSending(true);
    try {
      await api(`/api/schools/${schoolId}/notifications/`, {
        method: 'POST',
        body: { target_grade: notifGrade, message: notifMessage },
      });
      setNotifOpen(false);
      setNotifGrade('');
      setNotifMessage('');
    } catch {
      // silent
    } finally {
      setNotifSending(false);
    }
  };

  const handleCreateDeadline = async () => {
    if (!schoolId || !dlTitle.trim() || !dlDate) return;
    setDlSaving(true);
    try {
      await api(`/api/schools/${schoolId}/deadlines/`, {
        method: 'POST',
        body: {
          title: dlTitle,
          date: dlDate,
          time: dlTime || null,
          target_grade: dlGrade || null,
        },
      });
      setDeadlineOpen(false);
      setDlTitle('');
      setDlDate('');
      setDlTime('');
      setDlGrade('');
      fetchData();
    } catch {
      // silent
    } finally {
      setDlSaving(false);
    }
  };

  if (status === 'loading' || (loading && schoolId)) {
    return <LoadingState message="Loading school dashboard..." />;
  }

  if (!schoolId) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-700">
          No school is associated with your account. Please contact an administrator.
        </p>
      </div>
    );
  }

  if (error || !dashboard) return <ErrorState message={error || 'No data'} />;

  const grades = ['8', '9', '10', '11', '12'];

  return (
    <div className="space-y-8">
      {/* School Header */}
      <div className="flex items-center gap-4">
        {dashboard.school.logo_url && (
          <img
            src={dashboard.school.logo_url}
            alt={dashboard.school.name}
            className="h-12 w-12 rounded-lg object-cover"
          />
        )}
        <div className="flex flex-1 items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {dashboard.school.name}
              </h1>
              <Link
                href="/school/edit"
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500 transition hover:border-purple-300 hover:text-purple-700"
              >
                Edit
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              {dashboard.total_students} students ({dashboard.active_students}{' '}
              active)
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Quick Links
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { label: 'View Students', icon: 'users', href: '/school/students' },
            { label: 'Send Notification', icon: 'bell', action: () => setNotifOpen(true) },
            { label: 'Set Deadline', icon: 'calendar', action: () => setDeadlineOpen(true) },
          ].map((link) =>
            link.href ? (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 shadow-sm transition hover:border-purple-300 hover:bg-purple-50"
              >
                <FiIcon name={link.icon} className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
              </Link>
            ) : (
              <Button
                key={link.label}
                onClick={link.action}
                variant="outline"
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-purple-300 hover:bg-purple-50"
              >
                <FiIcon name={link.icon} className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
              </Button>
            ),
          )}
        </div>
      </section>

      {/* Section 1: Module Overview */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Module Overview
        </h2>
        {dashboard.modules.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-4 py-3">Expiration Date</th>
                    <th className="px-4 py-3">Purchased</th>
                    <th className="px-4 py-3">Used</th>
                    <th className="px-4 py-3">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {dashboard.modules.filter((mod) => mod.is_active).map((mod) => {
                    const remaining = mod.max_students !== null ? mod.max_students - mod.students_using : null;
                    return (
                      <tr key={mod.module_name} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{mod.module_display}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                          {mod.expiry_date ? new Date(mod.expiry_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {mod.max_students !== null ? mod.max_students : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{mod.students_using}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {remaining !== null ? remaining : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No modules configured yet.</p>
        )}
      </section>

      {/* Section 2: Grade-Wise Overview */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Grade-Wise Overview
          </h2>
          <div className="flex gap-2">
            <Button
              size='sm'
              onClick={() => setNotifOpen(true)}
              className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-700"
            >
              Send Notification
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setDeadlineOpen(true)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Set Deadline
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stream & Subject Selection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Career & Degree Selection 
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  College Selector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {dashboard.grade_overview.map((g) => (
                <tr key={g.grade} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {g.grade}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {g.student_count}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {g.domain_discovery_count}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {g.career_discovery_count}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {g.college_selector_count}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <a
                      href={`/school/students?grade=${g.grade}`}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      View Students
                    </a>
                  </td>
                </tr>
              ))}
              {dashboard.grade_overview.length > 0 && (
                <tr className="bg-gray-50 font-bold">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    Total
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {dashboard.grade_overview.reduce((acc, g) => acc + g.student_count, 0)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {dashboard.grade_overview.reduce((acc, g) => acc + g.domain_discovery_count, 0)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {dashboard.grade_overview.reduce((acc, g) => acc + g.career_discovery_count, 0)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {dashboard.grade_overview.reduce((acc, g) => acc + g.college_selector_count, 0)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <a
                      href="/school/students"
                      className="text-purple-600 hover:text-purple-800"
                    >
                      View All
                    </a>
                  </td>
                </tr>
              )}
              {dashboard.grade_overview.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-400"
                  >
                    No grade data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Send Notification Modal */}
      {notifOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Send Notification</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select Grade
                </label>
                <Select value={notifGrade || '__all__'} onValueChange={(v) => setNotifGrade(v === '__all__' ? '' : v)}>
                  <SelectTrigger>
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
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Enter notification details here..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setNotifOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendNotification}
                  disabled={notifSending || !notifMessage.trim()}
                >
                  {notifSending ? 'Sending...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Deadline Modal */}
      {deadlineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Set Deadline</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <Input
                  type="text"
                  value={dlTitle}
                  onChange={(e) => setDlTitle(e.target.value)}
                  placeholder="e.g., Essay 1 Deadline"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date
                </label>
                <Input
                  type="date"
                  value={dlDate}
                  onChange={(e) => setDlDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Time (optional)
                </label>
                <Input
                  type="time"
                  value={dlTime}
                  onChange={(e) => setDlTime(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Grade (optional)
                </label>
                <Select value={dlGrade || '__all__'} onValueChange={(v) => setDlGrade(v === '__all__' ? '' : v)}>
                  <SelectTrigger>
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
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setDeadlineOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateDeadline}
                  disabled={dlSaving || !dlTitle.trim() || !dlDate}
                >
                  {dlSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
