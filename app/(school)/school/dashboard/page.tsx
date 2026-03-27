'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api-client';
import { LoadingState, ErrorState } from '@/components/admin/LoadingState';

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
  sections: string[];
  boards: string[];
  student_count: number;
  domain_discovery_count: number;
  career_discovery_count: number;
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {dashboard.school.name}
          </h1>
          <p className="text-sm text-gray-500">
            {dashboard.total_students} students ({dashboard.active_students}{' '}
            active)
          </p>
        </div>
      </div>

      {/* Section 1: Module Overview */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Module Overview
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {dashboard.modules.length > 0 ? (
            dashboard.modules.map((mod) => (
              <div
                key={mod.module_name}
                className="min-w-[250px] rounded-lg border border-gray-200 bg-white p-4"
              >
                <h3 className="mb-2 font-semibold text-gray-900">
                  {mod.module_display}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    Students: {mod.students_using}
                    {mod.max_students ? `/${mod.max_students}` : ''}
                  </p>
                  {mod.expiry_date && (
                    <p>
                      Expires:{' '}
                      {new Date(mod.expiry_date).toLocaleDateString()}
                    </p>
                  )}
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold ${mod.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {mod.is_active ? 'Active' : 'Expired'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">No modules configured yet.</p>
          )}
        </div>
      </section>

      {/* Section 2: Grade-Wise Overview */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Grade-Wise Overview
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setNotifOpen(true)}
              className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-700"
            >
              Send Notification
            </button>
            <button
              onClick={() => setDeadlineOpen(true)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Set Deadline
            </button>
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
                  Sections
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Board
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Domain Discovery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Career Discovery
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
                    {g.sections.join(', ') || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {g.boards.join(', ') || '-'}
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
              {dashboard.grade_overview.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
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

      {/* Section 3: Application Overview (Placeholder) */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Application Overview
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase text-gray-500">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Applications Submitted
                </span>
                <span className="text-xl font-bold text-gray-900">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Avg. per Student
                </span>
                <span className="text-xl font-bold text-gray-900">—</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Application tracking coming soon
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase text-gray-500">
              Top 5 Colleges
            </h3>
            <div className="flex h-40 items-center justify-center text-sm text-gray-400">
              Chart placeholder — coming soon
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Calendar & Milestones */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Calendar & Milestones
        </h2>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          {deadlines.length > 0 ? (
            <div className="space-y-3">
              {deadlines.map((dl) => (
                <div
                  key={dl.id}
                  className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{dl.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(dl.date).toLocaleDateString()}
                      {dl.time ? ` at ${dl.time}` : ''}
                      {dl.target_grade
                        ? ` · Grade ${dl.target_grade}`
                        : ' · All grades'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    by {dl.created_by_email}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              No deadlines set yet.
            </p>
          )}
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
                <select
                  value={notifGrade}
                  onChange={(e) => setNotifGrade(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">All Grades</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </select>
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
                <button
                  onClick={() => setNotifOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={notifSending || !notifMessage.trim()}
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {notifSending ? 'Sending...' : 'Save'}
                </button>
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
                <input
                  type="text"
                  value={dlTitle}
                  onChange={(e) => setDlTitle(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g., Essay 1 Deadline"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  value={dlDate}
                  onChange={(e) => setDlDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Time (optional)
                </label>
                <input
                  type="time"
                  value={dlTime}
                  onChange={(e) => setDlTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Grade (optional)
                </label>
                <select
                  value={dlGrade}
                  onChange={(e) => setDlGrade(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">All Grades</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeadlineOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDeadline}
                  disabled={dlSaving || !dlTitle.trim() || !dlDate}
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {dlSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
