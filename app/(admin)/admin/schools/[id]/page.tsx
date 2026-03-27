'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';

interface SubscriptionItem {
  id: number;
  module_name: string;
  module_display: string;
  max_students: number | null;
  expiry_date: string;
  is_active: boolean;
}

interface SchoolDetail {
  id: number;
  name: string;
  logo_url: string | null;
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  student_count: number;
  subscriptions: SubscriptionItem[];
  created_at: string;
  updated_at: string;
}

interface StudentItem {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  grade: string;
  is_active: boolean;
}

export default function SchoolDetailPage() {
  const params = useParams();
  const schoolId = params?.id;
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add subscription modal
  const [subOpen, setSubOpen] = useState(false);
  const [subModule, setSubModule] = useState('');
  const [subMaxStudents, setSubMaxStudents] = useState('');
  const [subExpiry, setSubExpiry] = useState('');
  const [subSaving, setSubSaving] = useState(false);

  // Add student modal
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentEmail, setAddStudentEmail] = useState('');
  const [addStudentSaving, setAddStudentSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [schoolData, studentsData] = await Promise.all([
        api<SchoolDetail>(`/api/schools/${schoolId}/`),
        api<{ students: StudentItem[]; total: number }>(
          `/api/schools/${schoolId}/students/?page_size=10`
        ),
      ]);
      setSchool(schoolData);
      setStudents(studentsData.students);
      setTotalStudents(studentsData.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load school');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSubscription = async () => {
    if (!schoolId || !subModule || !subExpiry) return;
    setSubSaving(true);
    try {
      await api(`/api/schools/${schoolId}/subscriptions/`, {
        method: 'POST',
        body: {
          module_name: subModule,
          max_students: subMaxStudents ? parseInt(subMaxStudents) : null,
          expiry_date: subExpiry,
        },
      });
      setSubOpen(false);
      setSubModule('');
      setSubMaxStudents('');
      setSubExpiry('');
      fetchData();
    } catch {
      // silent
    } finally {
      setSubSaving(false);
    }
  };

  const handleAddStudent = async () => {
    if (!schoolId || !addStudentEmail.trim()) return;
    setAddStudentSaving(true);
    try {
      await api(`/api/schools/${schoolId}/students/`, {
        method: 'POST',
        body: { email: addStudentEmail },
      });
      setAddStudentOpen(false);
      setAddStudentEmail('');
      fetchData();
    } catch {
      // silent
    } finally {
      setAddStudentSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading school details...</p>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">Error: {error || 'Not found'}</p>
      </div>
    );
  }

  const moduleChoices = [
    'essay_brainstormer',
    'essay_evaluator',
    'college_selector',
    'degree_selector',
    'interview_prep',
    'resume_builder',
    'career_discovery',
    'domain_discovery',
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/schools"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Schools
      </Link>

      {/* School Info */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <div className="flex items-center gap-4">
          {school.logo_url ? (
            <img
              src={school.logo_url}
              alt={school.name}
              className="h-14 w-14 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-purple-100 text-xl font-bold text-purple-700">
              {school.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{school.name}</h1>
            <p className="text-sm text-gray-500">
              {[school.city, school.state, school.country]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
          <div className="ml-auto">
            <span
              className={`inline-flex rounded-full px-2 text-xs font-semibold ${school.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            >
              {school.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoItem label="Students" value={String(school.student_count)} />
          <InfoItem label="Contact" value={school.contact_email || '-'} />
          <InfoItem label="Phone" value={school.contact_phone || '-'} />
          <InfoItem
            label="Created"
            value={new Date(school.created_at).toLocaleDateString()}
          />
        </div>
      </div>

      {/* Module Subscriptions */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Module Subscriptions
          </h2>
          <button
            onClick={() => setSubOpen(true)}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            Add Module
          </button>
        </div>
        {school.subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {school.subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-md border border-gray-100 bg-gray-50 p-3"
              >
                <p className="font-medium text-gray-900">
                  {sub.module_display}
                </p>
                <p className="text-xs text-gray-500">
                  Max: {sub.max_students ?? 'Unlimited'} · Expires:{' '}
                  {new Date(sub.expiry_date).toLocaleDateString()}
                </p>
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold ${sub.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {sub.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No module subscriptions yet.</p>
        )}
      </div>

      {/* Students */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Students ({totalStudents})
          </h2>
          <button
            onClick={() => setAddStudentOpen(true)}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            Add Student
          </button>
        </div>
        {students.length > 0 ? (
          <div className="space-y-2">
            {students.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-4 py-2"
              >
                <div>
                  <Link
                    href={`/admin/users/${s.id}`}
                    className="text-sm font-medium text-purple-600 hover:text-purple-800"
                  >
                    {s.first_name || s.last_name
                      ? `${s.first_name} ${s.last_name}`.trim()
                      : s.email}
                  </Link>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {s.grade ? `Grade ${s.grade}` : ''}
                </div>
              </div>
            ))}
            {totalStudents > 10 && (
              <p className="pt-2 text-center text-xs text-gray-400">
                Showing 10 of {totalStudents} students
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No students assigned yet.</p>
        )}
      </div>

      {/* Add Subscription Modal */}
      {subOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Add Module</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Module
                </label>
                <select
                  value={subModule}
                  onChange={(e) => setSubModule(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select module...</option>
                  {moduleChoices.map((m) => (
                    <option key={m} value={m}>
                      {m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Max Students (optional)
                </label>
                <input
                  type="number"
                  value={subMaxStudents}
                  onChange={(e) => setSubMaxStudents(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={subExpiry}
                  onChange={(e) => setSubExpiry(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setSubOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubscription}
                  disabled={subSaving || !subModule || !subExpiry}
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {subSaving ? 'Saving...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {addStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Add Student</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Student Email
                </label>
                <input
                  type="email"
                  value={addStudentEmail}
                  onChange={(e) => setAddStudentEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="student@example.com"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setAddStudentOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStudent}
                  disabled={addStudentSaving || !addStudentEmail.trim()}
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {addStudentSaving ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase text-gray-400">
        {label}
      </p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}
